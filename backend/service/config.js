const fs = require("fs");

// NOTE:
// Do not throw at module-load time. This module is imported by payment services,
// and those services are imported during app startup because routes are mounted.
// In serverless (Vercel), throwing here crashes the whole function even if you
// never call Telebirr endpoints. Validate env at the moment you actually use it.
const requiredEnv = [
  "TELEBIRR_BASE_URL",
  "TELEBIRR_WEB_BASE_URL",
  "TELEBIRR_FABRIC_APP_ID",
  "TELEBIRR_APP_SECRET",
  "TELEBIRR_MERCHANT_APP_ID",
  "TELEBIRR_MERCHANT_CODE",
  "TELEBIRR_PRIVATE_KEY",
];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

const normalizeKey = (value) => (value ? value.replace(/\\n/g, "\n") : value);
const loadCaCert = () => {
  const caPath = process.env.TELEBIRR_CA_CERT_PATH;
  if (!caPath) return undefined;
  try {
    return fs.readFileSync(caPath, "utf8");
  } catch (err) {
    console.warn(
      `[Telebirr] Unable to read TELEBIRR_CA_CERT_PATH (${caPath}): ${err.message}`
    );
    return undefined;
  }
};
const caCert = loadCaCert();

module.exports = {
  missingEnv,
  baseUrl: process.env.TELEBIRR_BASE_URL,
  webBaseUrl: process.env.TELEBIRR_WEB_BASE_URL,
  otherParams: process.env.TELEBIRR_OTHER_PARAMS || "&version=1.0&trade_type=Checkout",
  fabricAppId: process.env.TELEBIRR_FABRIC_APP_ID,
  appSecret: process.env.TELEBIRR_APP_SECRET,
  merchantAppId: process.env.TELEBIRR_MERCHANT_APP_ID,
  merchantCode: process.env.TELEBIRR_MERCHANT_CODE,
  notifyUrl: process.env.TELEBIRR_NOTIFY_URL,
  redirectUrl: process.env.TELEBIRR_REDIRECT_URL,
  tradeType: process.env.TELEBIRR_TRADE_TYPE || "Checkout",
  businessType: process.env.TELEBIRR_BUSINESS_TYPE || "BuyGoods",
  transCurrency: process.env.TELEBIRR_TRANS_CURRENCY || "ETB",
  timeoutExpress: (() => {
    const value = process.env.TELEBIRR_TIMEOUT_EXPRESS;
    if (!value) return "120m";
    return /^\d+m$/.test(value.trim()) ? value.trim() : "120m";
  })(),
  payeeIdentifierType: process.env.TELEBIRR_PAYEE_IDENTIFIER_TYPE || "04",
  payeeType: process.env.TELEBIRR_PAYEE_TYPE || "5000",
  includeRedirect: process.env.TELEBIRR_INCLUDE_REDIRECT === "true",
  includeCallbackInfo: process.env.TELEBIRR_INCLUDE_CALLBACK_INFO === "true",
  privateKey: normalizeKey(process.env.TELEBIRR_PRIVATE_KEY),
  rejectUnauthorized: process.env.TELEBIRR_REJECT_UNAUTHORIZED !== "false",
  caCert,
};
