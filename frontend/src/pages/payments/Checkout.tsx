import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { authStorage } from "@/lib/auth";
import { getSafeImageUrl } from "@/lib/media";
import type { ApiResponse, Course } from "@/lib/types";

type TelebirrCreateOrderData = {
  checkoutUrl?: string;
  rawRequest?: string;
  rawRequestSource?: "provider" | "generated";
  merchOrderId?: string;
  prepayId?: string;
};

type TelebirrAuthTokenData = {
  openId?: string | null;
  identityId?: string | null;
  identityType?: string | null;
  walletIdentityId?: string | null;
  identifier?: string | null;
  nickName?: string | null;
  status?: string | null;
};

type MiniAppBridge = {
  startPay?: (options: {
    rawRequest: string;
    success?: (result: MiniAppPaymentResult) => void;
    fail?: (error: MiniAppPaymentResult) => void;
  }) => void;
  tradePay?: (options: {
    tradeNO: string;
    orderStr: string;
    sign: string;
    extendParam?: string;
    success?: (result: MiniAppPaymentResult) => void;
    fail?: (error: MiniAppPaymentResult) => void;
  }) => void | Promise<MiniAppPaymentResult> | MiniAppPaymentResult;
  native?: (
    method: string,
    options: Record<string, string>
  ) => Promise<
    MiniAppPaymentResult & {
      token?: string;
      effectiveDate?: string;
      expirationDate?: string;
    }
  >;
  getAuthCode?: (options: {
    scopes: string[];
    success?: (result: { authCode?: string; token?: string }) => void;
    fail?: (error: { message?: string; errorMessage?: string }) => void;
  }) => void;
};

type MiniAppPaymentResult = {
  resultCode?: string | number;
  result_code?: string | number;
  code?: string | number;
  status?: string | number;
  tradeStatus?: string;
  trade_status?: string;
  orderStatus?: string;
  order_status?: string;
  errMsg?: string;
  message?: string;
  errorMessage?: string;
};

type PaymentErrorLike = {
  errMsg?: string;
  message?: string;
  errorMessage?: string;
  response?: {
    status?: number;
    data?: {
      error?: string;
      message?: string;
    };
  };
};

type MiniAppPaymentIdentity = {
  openId?: string | null;
  identityId?: string | null;
  identityType?: string | null;
  walletIdentityId?: string | null;
  identifier?: string | null;
};

const telebirrChannel = (import.meta.env.VITE_TELEBIRR_CHANNEL || "h5").toLowerCase();
const configuredMiniAppId =
  import.meta.env.VITE_MINI_APP_ID?.trim() ||
  import.meta.env.VITE_TELEBIRR_MINI_APP_ID?.trim() ||
  "";
const resolveMiniAppSdkUrl = () => {
  const configuredUrl = import.meta.env.VITE_MINI_APP_SDK_URL?.trim();
  if (configuredUrl) {
    return configuredUrl;
  }

  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}js-sdk.min.js`;
};
const miniAppSdkUrl = resolveMiniAppSdkUrl();

const getMiniAppBridge = (): MiniAppBridge | null => {
  if (typeof window === "undefined") return null;
  const runtimeWindow = window as Window & { ma?: MiniAppBridge; my?: MiniAppBridge };
  return runtimeWindow.ma || runtimeWindow.my || null;
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getMiniAppRuntimeInfo = () => {
  if (typeof window === "undefined") return {};
  const bridge = getMiniAppBridge();
  const runtimeWindow = window as Window & {
    ma?: MiniAppBridge;
    my?: MiniAppBridge;
    __ma_environment?: string;
  };
  return {
    hasMa: Boolean(runtimeWindow.ma),
    hasMy: Boolean(runtimeWindow.my),
    hasNative: typeof bridge?.native === "function",
    hasTradePay: typeof bridge?.tradePay === "function",
    maEnvironment: runtimeWindow.__ma_environment || null,
    userAgent: window.navigator.userAgent,
  };
};

const getRawRequestKeys = (rawRequest: string) => {
  const params = new URLSearchParams(rawRequest.trim());
  return Array.from(params.keys());
};

const normalizeDebugValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return String(value);
  }
};

const reportMiniAppDebug = (stage: string, details: Record<string, unknown>) => {
  const payload = {
    stage,
    timestamp: new Date().toISOString(),
    ...details,
  };

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("telebirr_mini_last_debug", JSON.stringify(payload));
  }

  void api.post("/payments/telebirr/mini-debug", payload).catch((error: unknown) => {
    console.warn("[Telebirr] Failed to report mini app debug", error);
  });
};

const getRawRequestParam = (rawRequest: string, key: string) => {
  const params = new URLSearchParams(rawRequest.trim());
  return params.get(key);
};

const getEncodedRawRequestParam = (rawRequest: string, key: string) => {
  const pair = rawRequest
    .trim()
    .split("&")
    .find((item) => item.split("=")[0] === key);
  return pair ? pair.slice(key.length + 1) : null;
};

const buildMiniAppOrderStr = (rawRequest: string) => {
  const params = new URLSearchParams(rawRequest.trim());
  params.delete("sign");
  params.delete("sign_type");
  return params.toString();
};

const asPaymentError = (error: unknown): PaymentErrorLike => {
  return error && typeof error === "object" ? (error as PaymentErrorLike) : {};
};

const getPaymentErrorMessage = (error: unknown, fallback: string) => {
  const paymentError = asPaymentError(error);
  const rawError =
    error && typeof error === "object" ? JSON.stringify(error) : String(error || "");

  return (
    paymentError.response?.data?.error ||
    paymentError.response?.data?.message ||
    paymentError.errMsg ||
    paymentError.message ||
    paymentError.errorMessage ||
    (rawError && rawError !== "{}" ? rawError : "") ||
    fallback
  );
};

const getMiniAppPaymentStatus = (result: MiniAppPaymentResult = {}) => {
  return String(
    result.resultCode ??
      result.result_code ??
      result.code ??
      result.status ??
      result.tradeStatus ??
      result.trade_status ??
      result.orderStatus ??
      result.order_status ??
      result.errMsg ??
      result.message ??
      result.errorMessage ??
      ""
  )
    .trim()
    .toLowerCase();
};

const isMiniAppPaymentSuccess = (
  result: MiniAppPaymentResult | undefined,
  source: "success" | "fail"
) => {
  const status = getMiniAppPaymentStatus(result);

  if (!status) {
    return source === "success";
  }

  if (
    status === "0" ||
    status === "1" ||
    status === "0000" ||
    status === "9000" ||
    status === "8000" ||
    status === "6004" ||
    status === "success" ||
    status === "pay_success" ||
    status === "completed" ||
    status === "complete" ||
    status === "paid" ||
    status.includes(":ok") ||
    status.includes("success")
  ) {
    return true;
  }

  return false;
};

const isMiniAppPaymentCancelled = (result: MiniAppPaymentResult = {}) => {
  const status = getMiniAppPaymentStatus(result);
  return (
    status.includes("cancel") ||
    status.includes("close") ||
    status.includes("abort") ||
    status === "-1"
  );
};

const isMiniAppPaymentFinalFailure = (result: MiniAppPaymentResult = {}) => {
  const status = getMiniAppPaymentStatus(result);
  return status === "4000" || status.includes("fail") || status.includes("error");
};

const getMiniAppAccessToken = async (bridge: MiniAppBridge, rawRequest: string) => {
  const rawRequestAppId = getRawRequestParam(rawRequest, "appid");
  const appId = configuredMiniAppId || rawRequestAppId;
  const debugBase = {
    appId,
    appIdSource: configuredMiniAppId ? "env" : "rawRequest",
    rawRequestAppId,
    rawRequestKeys: getRawRequestKeys(rawRequest),
    runtime: getMiniAppRuntimeInfo(),
  };

  if (!appId) {
    reportMiniAppDebug("getMiniAppToken:missing-appid", debugBase);
    throw new Error("Missing appid in mini app payment request.");
  }

  reportMiniAppDebug("getMiniAppToken:start", debugBase);

  let token: string | null = null;
  let lastError: unknown = null;

  if (typeof bridge.native === "function") {
    try {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const tokenResponse = await bridge.native("getMiniAppToken", { appId });
          token = tokenResponse?.token || null;
          if (token) {
            reportMiniAppDebug("getMiniAppToken:success", {
              ...debugBase,
              attempt,
              tokenReturned: true,
              effectiveDate: tokenResponse.effectiveDate || null,
              expirationDate: tokenResponse.expirationDate || null,
            });
            break;
          }
          lastError = tokenResponse;
          reportMiniAppDebug("getMiniAppToken:no-token-response", {
            ...debugBase,
            attempt,
            sdkResponse: normalizeDebugValue(tokenResponse),
          });
        } catch (error: unknown) {
          lastError = error;
          reportMiniAppDebug("getMiniAppToken:attempt-failed", {
            ...debugBase,
            attempt,
            sdkRejection: normalizeDebugValue(error),
          });
        }

        if (attempt < 3) {
          await sleep(400);
        }
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (typeof bridge.native !== "function") {
    reportMiniAppDebug("getMiniAppToken:native-missing", debugBase);
    throw new Error("Mini App native bridge is unavailable. Open this page inside the SuperApp.");
  }

  if (!token) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "telebirr_mini_token_debug",
        JSON.stringify({
          ...debugBase,
          error:
            lastError && typeof lastError === "object"
              ? lastError
              : String(lastError || ""),
        })
      );
    }
    reportMiniAppDebug("getMiniAppToken:failed", {
      ...debugBase,
      sdkRejection: normalizeDebugValue(lastError),
    });
    throw new Error(
      getPaymentErrorMessage(
        lastError,
        `Unable to get Mini App access token from the SuperApp for appId ${appId}.`
      )
    );
  }

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("mini_app_access_token", token);
  }

  return token;
};

const exchangeMiniAppAccessToken = async (accessToken: string) => {
  const response = await api.post<ApiResponse<TelebirrAuthTokenData>>(
    "/payments/telebirr/auth-token",
    {
      accessToken,
      channel: "mini",
    }
  );

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(
      "telebirr_auth_identity",
      JSON.stringify(response.data?.data || {})
    );
  }

  return response.data?.data || null;
};

const loadMiniAppSdk = async () => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (getMiniAppBridge()) {
    return;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[data-miniapp-sdk="true"]`
  );

  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      if (getMiniAppBridge()) {
        resolve();
        return;
      }

      const handleLoad = () => resolve();
      const handleError = () => reject(new Error(`Failed to load mini app SDK from ${miniAppSdkUrl}`));

      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = miniAppSdkUrl;
    script.async = true;
    script.dataset.miniappSdk = "true";
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error(`Failed to load mini app SDK from ${miniAppSdkUrl}`));
    document.head.appendChild(script);
  });
};

const startMiniAppPayment = (
  bridge: MiniAppBridge,
  request: string,
  identity: MiniAppPaymentIdentity | null,
  callbacks: {
    onSuccess: (result: MiniAppPaymentResult) => void;
    onFail: (error: MiniAppPaymentResult) => void;
  }
) => {
  const normalizedRequest = request.trim();
  const tradeNO = getRawRequestParam(normalizedRequest, "prepay_id") || "";
  const sign = getRawRequestParam(normalizedRequest, "sign") || "";
  const encodedSign = getEncodedRawRequestParam(normalizedRequest, "sign") || sign;
  const orderStr = buildMiniAppOrderStr(normalizedRequest);
  const identityPayload: Record<string, string> = {};
  if (identity?.openId) identityPayload.openId = identity.openId;
  if (identity?.identityId) identityPayload.identityId = identity.identityId;
  if (identity?.identityType) identityPayload.identityType = identity.identityType;
  if (identity?.walletIdentityId) identityPayload.walletIdentityId = identity.walletIdentityId;
  if (identity?.identifier) identityPayload.identifier = identity.identifier;
  let settled = false;
  const settleSuccess = (result: MiniAppPaymentResult) => {
    if (settled) return;
    settled = true;
    callbacks.onSuccess(result);
  };
  const settleFail = (error: MiniAppPaymentResult) => {
    if (settled) return;
    settled = true;
    if (typeof callbacks.onFail !== "function") {
      console.error("[Telebirr] Mini app payment failure callback is not configured", error);
      return;
    }
    callbacks.onFail(error);
  };
  const timeoutId = window.setTimeout(() => {
    settleFail({
      message:
        "Mini app payment bridge did not respond. This usually means the runtime does not support the requested payment API or the SDK method name is mismatched.",
    });
  }, 10000);

  const wrapSuccess = (result: MiniAppPaymentResult) => {
    window.clearTimeout(timeoutId);
    settleSuccess(result);
  };
  const wrapFail = (error: MiniAppPaymentResult) => {
    window.clearTimeout(timeoutId);
    if (isMiniAppPaymentSuccess(error, "fail")) {
      settleSuccess(error);
      return;
    }
    settleFail(error);
  };

  if (bridge.tradePay) {
    const result = bridge.tradePay({
      tradeNO,
      orderStr,
      sign,
      extendParam: "",
      success: wrapSuccess,
      fail: wrapFail,
    });

    if (result && typeof (result as Promise<MiniAppPaymentResult>).then === "function") {
      void (result as Promise<MiniAppPaymentResult>).then(wrapSuccess).catch(wrapFail);
    } else if (result && isMiniAppPaymentFinalFailure(result as MiniAppPaymentResult)) {
      wrapFail(result as MiniAppPaymentResult);
    }

    return true;
  }

  if (bridge.native && tradeNO && orderStr && encodedSign) {
    void bridge
      .native("tradePay", {
        tradeNO,
        orderStr,
        sign: encodedSign,
        extendParam: "",
        ...identityPayload,
      })
      .then((result) => {
        if (result && isMiniAppPaymentFinalFailure(result)) {
          wrapFail(result);
          return;
        }
        wrapSuccess(result || {});
      })
      .catch(wrapFail);
    return true;
  }

  if (bridge.startPay) {
    bridge.startPay({
      rawRequest: normalizedRequest,
      success: wrapSuccess,
      fail: wrapFail,
    });
    return true;
  }

  return false;
};

const Checkout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [rawRequest, setRawRequest] = useState<string | null>(null);
  const [merchOrderId, setMerchOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMiniChannel = telebirrChannel === "mini";

  useEffect(() => {
    let active = true;
    if (!courseId) return;

    const token = authStorage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const courseRes = await api.get<ApiResponse<Course>>(`/courses/${courseId}`);
        if (!active) return;
        setCourse(courseRes.data.data);

        const checkoutRes = await api.post<ApiResponse<TelebirrCreateOrderData>>(
          "/payments/telebirr/create-order",
          {
            courseId,
            channel: telebirrChannel,
          }
        );
        if (!active) return;

        const orderData = checkoutRes.data?.data || {};
        setCheckoutUrl(orderData.checkoutUrl || null);
        setRawRequest(orderData.rawRequest || null);
        setMerchOrderId(orderData.merchOrderId || null);
        if (typeof window !== "undefined" && orderData.rawRequest) {
          const rawRequestParams = new URLSearchParams(orderData.rawRequest);
          window.sessionStorage.setItem(
            "telebirr_order_debug",
            JSON.stringify({
              rawRequestSource: orderData.rawRequestSource || "unknown",
              prepayId: orderData.prepayId || rawRequestParams.get("prepay_id"),
              rawRequestKeys: Array.from(rawRequestParams.keys()),
            })
          );
        }
        if (isMiniChannel) {
          if (!orderData.rawRequest) {
            setError("Unable to start mini app payment. Please try again.");
          }
        } else if (!orderData.checkoutUrl) {
          setError("Unable to start payment. Please try again.");
        }
      } catch (err: unknown) {
        if (!active) return;
        const paymentError = asPaymentError(err);
        if (paymentError.response?.status === 401 || paymentError.response?.status === 403) {
          authStorage.clearAll();
          navigate("/login");
          return;
        }
        if (paymentError.response?.status === 404) {
          const backendMessage =
            paymentError.response?.data?.error || paymentError.response?.data?.message;
          setError(backendMessage || "Course not found or not available for purchase.");
          return;
        }
        setError(getPaymentErrorMessage(err, "Unable to start payment."));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, isMiniChannel, navigate]);

  const handleProceed = async () => {
    if (isRedirecting) return;
    setError(null);

    if (isMiniChannel) {
      if (!rawRequest) {
        setError("Mini app payment is unavailable because rawRequest was not returned.");
        return;
      }

      setIsRedirecting(true);
      try {
        await loadMiniAppSdk();
      } catch (sdkError: unknown) {
        setIsRedirecting(false);
        setError(
          getPaymentErrorMessage(sdkError, "Failed to load the Mini App payment SDK.")
        );
        return;
      }

      const bridge = getMiniAppBridge();
      if (!bridge) {
        setIsRedirecting(false);
        setError(
          "Mini app payment bridge is not available in this runtime. Ensure js-sdk.min.js is bundled and the page is running inside the Telebirr Mini App runtime."
        );
        return;
      }

      let authIdentity: MiniAppPaymentIdentity | null = null;
      try {
        const accessToken = await getMiniAppAccessToken(bridge, rawRequest);
        authIdentity = await exchangeMiniAppAccessToken(accessToken);
      } catch (tokenError: unknown) {
        setIsRedirecting(false);
        setError(getPaymentErrorMessage(tokenError, "Failed to obtain Mini App access token."));
        return;
      }

      const started = startMiniAppPayment(bridge, rawRequest, authIdentity, {
        onSuccess: (result) => {
          if (isMiniAppPaymentSuccess(result, "success")) {
            navigate(
              `/payment/return?courseId=${encodeURIComponent(courseId || "")}${merchOrderId ? `&merch_order_id=${encodeURIComponent(merchOrderId)}` : ""}`
            );
            return;
          }

          setIsRedirecting(false);
          setError("Mini app payment was cancelled or did not complete.");
        },
        onFail: (tradeError) => {
          if (isMiniAppPaymentSuccess(tradeError, "fail")) {
            navigate(
              `/payment/return?courseId=${encodeURIComponent(courseId || "")}${merchOrderId ? `&merch_order_id=${encodeURIComponent(merchOrderId)}` : ""}`
            );
            return;
          }

          const message =
            isMiniAppPaymentCancelled(tradeError)
              ? "Mini app payment was cancelled or did not complete."
              : tradeError?.message ||
                tradeError?.errorMessage ||
                "Mini app payment failed.";
          setIsRedirecting(false);
          setError(message);
        },
      });

      if (!started) {
        setIsRedirecting(false);
        setError("Mini app payment bridge is not available in this runtime.");
      }
      return;
    }

    if (!checkoutUrl) return;
    setIsRedirecting(true);
    window.location.href = checkoutUrl;
  };

  const priceValue = Number(course?.price || 0);
  const priceLabel = priceValue > 0 ? `ETB ${priceValue.toLocaleString()}` : "Free";
  const courseImageUrl = getSafeImageUrl(course?.imageUrl);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 lg:pt-24">
        <div className="container-wide section-padding py-10">
          <div className="max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/2">
                  <div className="aspect-video rounded-xl overflow-hidden bg-muted">
                    {courseImageUrl ? (
                      <img
                        src={courseImageUrl}
                        alt={course.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        {isLoading ? "Loading..." : "Course image"}
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:w-1/2 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                      Checkout
                    </p>
                    <h1 className="text-2xl font-semibold">
                      {course?.title || "Course checkout"}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2">
                      {course?.description || "Review your course and proceed to payment."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-4">
                    <p className="text-xs text-muted-foreground uppercase">Total</p>
                    <p className="text-2xl font-semibold">{priceLabel}</p>
                  </div>
                  {error && !isLoading && (
                    <p className="text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate(-1)}>
                      Back
                    </Button>
                    <Button
                      variant="gradient"
                      className="flex-1"
                      disabled={
                        isLoading ||
                        isRedirecting ||
                        (isMiniChannel ? !rawRequest : !checkoutUrl)
                      }
                      onClick={handleProceed}
                    >
                      {isRedirecting
                        ? isMiniChannel
                          ? "Opening mini app payment..."
                          : "Redirecting..."
                        : "Proceed"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
