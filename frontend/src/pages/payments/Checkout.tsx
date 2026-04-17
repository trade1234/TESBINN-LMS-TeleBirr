import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getSafeImageUrl } from "@/lib/media";
import type { ApiResponse, Course } from "@/lib/types";

type TelebirrCreateOrderData = {
  checkoutUrl?: string;
  rawRequest?: string;
  merchOrderId?: string;
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
    success?: (result: { resultCode?: string }) => void;
    fail?: (error: { message?: string; errorMessage?: string }) => void;
  }) => void;
  tradePay?: (options: {
    rawRequest?: string;
    tradeNO?: string;
    orderStr?: string;
    sign?: string;
    extendParam?: string;
    success?: (result: { resultCode?: string }) => void;
    fail?: (error: { message?: string; errorMessage?: string }) => void;
  }) => void;
  native?: (
    method: string,
    options: Record<string, string>
  ) => Promise<{ resultCode?: string; token?: string }>;
};

const telebirrChannel = (import.meta.env.VITE_TELEBIRR_CHANNEL || "h5").toLowerCase();
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

const getRawRequestParam = (rawRequest: string, key: string) => {
  const params = new URLSearchParams(rawRequest.trim());
  return params.get(key);
};

const getMiniAppAccessToken = async (bridge: MiniAppBridge, rawRequest: string) => {
  if (!bridge.native) {
    return null;
  }

  const appId = getRawRequestParam(rawRequest, "appid");
  if (!appId) {
    throw new Error("Missing appid in mini app payment request.");
  }

  const tokenResponse = await bridge.native("getMiniAppToken", { appId });
  if (!tokenResponse?.token) {
    throw new Error("Mini App access token was not returned by the SuperApp.");
  }

  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("mini_app_access_token", tokenResponse.token);
  }

  return tokenResponse.token;
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
  callbacks: {
    onSuccess: (result: { resultCode?: string }) => void;
    onFail: (error: { message?: string; errorMessage?: string }) => void;
  }
) => {
  const normalizedRequest = request.trim();
  let settled = false;
  const settleSuccess = (result: { resultCode?: string }) => {
    if (settled) return;
    settled = true;
    callbacks.onSuccess(result);
  };
  const settleFail = (error: { message?: string; errorMessage?: string }) => {
    if (settled) return;
    settled = true;
    callbacks.onFail(error);
  };
  const timeoutId = window.setTimeout(() => {
    settleFail({
      message:
        "Mini app payment bridge did not respond. This usually means the runtime does not support the requested payment API or the SDK method name is mismatched.",
    });
  }, 10000);

  const wrapSuccess = (result: { resultCode?: string }) => {
    window.clearTimeout(timeoutId);
    settleSuccess(result);
  };
  const wrapFail = (error: { message?: string; errorMessage?: string }) => {
    window.clearTimeout(timeoutId);
    settleFail(error);
  };

  if (bridge.native) {
    bridge
      .native("startPay", {
        rawRequest: normalizedRequest,
        bussinessType: "BuyGoods",
      })
      .then((result) => {
        window.clearTimeout(timeoutId);
        wrapSuccess(result);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        wrapFail({
          message:
            error?.message ||
            error?.errorMessage ||
            "Mini app payment failed.",
        });
      });
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

  if (bridge.tradePay) {
    bridge.tradePay({
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
        if (isMiniChannel) {
          if (!orderData.rawRequest) {
            setError("Unable to start mini app payment. Please try again.");
          }
        } else if (!orderData.checkoutUrl) {
          setError("Unable to start payment. Please try again.");
        }
      } catch (err: any) {
        if (!active) return;
        if (err?.response?.status === 404) {
          const backendMessage =
            err?.response?.data?.error || err?.response?.data?.message;
          setError(backendMessage || "Course not found or not available for purchase.");
          return;
        }
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Unable to start payment.";
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [courseId, isMiniChannel]);

  const handleProceed = async () => {
    setError(null);

    if (isMiniChannel) {
      if (!rawRequest) {
        setError("Mini app payment is unavailable because rawRequest was not returned.");
        return;
      }

      try {
        await loadMiniAppSdk();
      } catch (sdkError: any) {
        setError(
          sdkError?.message ||
            "Failed to load the Mini App payment SDK."
        );
        return;
      }

      const bridge = getMiniAppBridge();
      if (!bridge) {
        setError(
          "Mini app payment bridge is not available in this runtime. Ensure js-sdk.min.js is bundled and the page is running inside the Telebirr Mini App runtime."
        );
        return;
      }

      try {
        const accessToken = await getMiniAppAccessToken(bridge, rawRequest);
        if (accessToken) {
          await exchangeMiniAppAccessToken(accessToken);
        }
      } catch (tokenError: any) {
        console.warn("[Telebirr] Mini App access token request failed", {
          message:
            tokenError?.message ||
            "Failed to obtain Mini App access token.",
        });
      }

      setIsRedirecting(true);
      const started = startMiniAppPayment(bridge, rawRequest, {
        onSuccess: (result) => {
          if (result?.resultCode === "1") {
            navigate(
              `/payment/return?courseId=${encodeURIComponent(courseId || "")}${merchOrderId ? `&merch_order_id=${encodeURIComponent(merchOrderId)}` : ""}`
            );
            return;
          }

          setIsRedirecting(false);
          setError("Mini app payment was cancelled or did not complete.");
        },
        fail: (tradeError) => {
          const message =
            tradeError?.message ||
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
