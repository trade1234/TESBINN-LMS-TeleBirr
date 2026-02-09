const applyFabricToken = require("./applyFabricTokenService");
const https = require("https");
const tools = require("../utils/telebirrTools");
const config = require("./config");

const logJson = (label, value) => {
  const payload = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  console.log(`[Telebirr] ${label}: ${payload}`);
};

const postJson = (url, headers, body) =>
  new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);

    const options = {
      method: "POST",
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        ...headers,
      },
      rejectUnauthorized: config.rejectUnauthorized,
      ca: config.caCert,
    };

    logJson("Request URL", url);
    logJson("Request Headers", options.headers);
    logJson("Request Body", body);

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        if (!raw) {
          reject(new Error("Empty response from Telebirr"));
          return;
        }
        try {
          const parsedBody = JSON.parse(raw);
          logJson("Response Status", res.statusCode || "unknown");
          logJson("Response Body", parsedBody);
          resolve(parsedBody);
        } catch (err) {
          const error = new Error(`Invalid JSON response: ${raw}`);
          reject(error);
        }
      });
    });

    req.setTimeout(30000, () => {
      req.destroy(new Error("Telebirr request timeout"));
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });

exports.requestCreateOrder = async (
  fabricToken,
  title,
  amount,
  merchOrderId,
  redirectUrl,
  payerPhone
) => {
  const reqObject = createRequestObject(
    title,
    amount,
    merchOrderId,
    redirectUrl,
    payerPhone
  );
  return postJson(
    `${config.baseUrl}/payment/v1/merchant/preOrder`,
    { "X-APP-Key": config.fabricAppId, Authorization: fabricToken },
    reqObject
  );
};

function createRequestObject(title, amount, merchOrderId, redirectUrl, payerPhone) {
  let req = {
    timestamp: tools.createTimeStamp(),
    nonce_str: tools.createNonceStr(),
    method: "payment.preorder",
    version: "1.0",
  };
  let biz = {
    notify_url: config.notifyUrl,
    trade_type: config.tradeType,
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    merch_order_id: merchOrderId,
    title: title,
    total_amount: amount,
    trans_currency: config.transCurrency,
    business_type: config.businessType,
    timeout_express: config.timeoutExpress,
    payee_identifier: config.merchantCode,
    payee_identifier_type: config.payeeIdentifierType,
    payee_type: config.payeeType,
  };
  if (config.includeRedirect && (redirectUrl || config.redirectUrl)) {
    biz.redirect_url = redirectUrl || config.redirectUrl;
  }
  if (config.includeCallbackInfo && payerPhone) {
    biz.callback_info = payerPhone;
  }
  req.biz_content = biz;
  req.sign = tools.signRequestObject(req, config.privateKey);
  req.sign_type = "SHA256WithRSA";
  return req;
}

function createRawRequest(prepayId) {
  const map = {
    appid: config.merchantAppId,
    merch_code: config.merchantCode,
    nonce_str: tools.createNonceStr(), // tools code you can download form demo
    prepay_id: prepayId,
    timestamp: tools.createTimeStamp(), // tools code you can download form demo
  };
  const sign = tools.signRequestObject(map, config.privateKey);
  const params = new URLSearchParams({
    appid: map.appid,
    merch_code: map.merch_code,
    nonce_str: map.nonce_str,
    prepay_id: map.prepay_id,
    timestamp: map.timestamp,
    sign,
    sign_type: "SHA256WithRSA",
  });
  return params.toString();
}

function createCheckoutUrl(prepayId) {
  const rawRequest = createRawRequest(prepayId);
  const base = config.webBaseUrl || "";
  const separator = base.includes("?")
    ? base.endsWith("?") || base.endsWith("&")
      ? ""
      : "&"
    : "?";
  const otherParams = config.otherParams || "";
  const normalizedOtherParams = otherParams
    ? otherParams.startsWith("&") || otherParams.startsWith("?")
      ? otherParams
      : `&${otherParams}`
    : "";
  return `${base}${separator}${rawRequest}${normalizedOtherParams}`;
}

module.exports = {
  requestCreateOrder: exports.requestCreateOrder,
  createCheckoutUrl,
};
