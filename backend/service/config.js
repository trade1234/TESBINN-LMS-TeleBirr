const fs = require("fs");

const VALID_CHANNELS = ["h5", "mini"];

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

const getChannel = (value) => {
  const normalized = String(value || process.env.TELEBIRR_DEFAULT_MODE || "h5").toLowerCase();
  return VALID_CHANNELS.includes(normalized) ? normalized : "h5";
};

const readChannelValue = (channel, suffix, fallbackKey) => {
  const channelPrefix = channel === "mini" ? "TELEBIRR_MINI_" : "TELEBIRR_H5_";
  const h5FallbackKey = `TELEBIRR_H5_${suffix}`;
  const miniFallbackKey = `TELEBIRR_MINI_${suffix}`;

  return (
    process.env[`${channelPrefix}${suffix}`] ||
    (fallbackKey ? process.env[fallbackKey] : undefined) ||
    (channel === "mini" ? process.env[h5FallbackKey] : process.env[miniFallbackKey]) ||
    undefined
  );
};

const getRequiredEnvLabels = (channel) => {
  if (channel === "mini") {
    return {
      baseUrl: "TELEBIRR_MINI_BASE_URL",
      fabricAppId: "TELEBIRR_MINI_FABRIC_APP_ID",
      appSecret: "TELEBIRR_MINI_APP_SECRET",
      merchantAppId: "TELEBIRR_MINI_MERCHANT_APP_ID",
      merchantCode: "TELEBIRR_MINI_MERCHANT_CODE",
      privateKey: "TELEBIRR_MINI_PRIVATE_KEY",
      webBaseUrl: "TELEBIRR_MINI_WEB_BASE_URL",
    };
  }

  return {
    baseUrl: "TELEBIRR_BASE_URL",
    fabricAppId: "TELEBIRR_FABRIC_APP_ID",
    appSecret: "TELEBIRR_APP_SECRET",
    merchantAppId: "TELEBIRR_MERCHANT_APP_ID",
    merchantCode: "TELEBIRR_MERCHANT_CODE",
    privateKey: "TELEBIRR_PRIVATE_KEY",
    webBaseUrl: "TELEBIRR_WEB_BASE_URL",
  };
};

const resolveChannelConfig = (channelInput) => {
  const channel = getChannel(channelInput);
  const envLabels = getRequiredEnvLabels(channel);
  const baseUrl = readChannelValue(channel, "BASE_URL", "TELEBIRR_BASE_URL");
  const webBaseUrl = readChannelValue(channel, "WEB_BASE_URL", "TELEBIRR_WEB_BASE_URL");
  const fabricAppId = readChannelValue(
    channel,
    "FABRIC_APP_ID",
    "TELEBIRR_FABRIC_APP_ID"
  );
  const appSecret = readChannelValue(channel, "APP_SECRET", "TELEBIRR_APP_SECRET");
  const merchantAppId = readChannelValue(channel, "MERCHANT_APP_ID", "TELEBIRR_MERCHANT_APP_ID");
  const merchantCode = readChannelValue(
    channel,
    "MERCHANT_CODE",
    "TELEBIRR_MERCHANT_CODE"
  );
  const privateKey = normalizeKey(
    readChannelValue(channel, "PRIVATE_KEY", "TELEBIRR_PRIVATE_KEY")
  );
  const tradeType =
    readChannelValue(channel, "TRADE_TYPE", "TELEBIRR_TRADE_TYPE") ||
    (channel === "mini" ? "InApp" : "Checkout");
  const includeRedirect =
    process.env.TELEBIRR_INCLUDE_REDIRECT === "true" || tradeType !== "InApp";
  const otherParams =
    readChannelValue(channel, "OTHER_PARAMS", "TELEBIRR_OTHER_PARAMS") ||
    (tradeType === "InApp" ? "" : "&version=1.0&trade_type=Checkout");

  const requiredEnv = [
    [envLabels.baseUrl, baseUrl],
    [envLabels.fabricAppId, fabricAppId],
    [envLabels.appSecret, appSecret],
    [envLabels.merchantAppId, merchantAppId],
    [envLabels.merchantCode, merchantCode],
    [envLabels.privateKey, privateKey],
  ];

  if (tradeType !== "InApp") {
    requiredEnv.push([envLabels.webBaseUrl, webBaseUrl]);
  }

  const rejectUnauthorizedValue =
    channel === "mini"
      ? process.env.TELEBIRR_MINI_REJECT_UNAUTHORIZED
      : process.env.TELEBIRR_H5_REJECT_UNAUTHORIZED;
  const rejectUnauthorized =
    (rejectUnauthorizedValue ?? process.env.TELEBIRR_REJECT_UNAUTHORIZED) !== "false";

  return {
    channel,
    missingEnv: requiredEnv.filter(([, value]) => !value).map(([key]) => key),
    baseUrl,
    webBaseUrl,
    otherParams,
    fabricAppId,
    appSecret,
    merchantAppId,
    merchantCode,
    notifyUrl: readChannelValue(channel, "NOTIFY_URL", "TELEBIRR_NOTIFY_URL"),
    redirectUrl: readChannelValue(channel, "REDIRECT_URL", "TELEBIRR_REDIRECT_URL"),
    tradeType,
    businessType: process.env.TELEBIRR_BUSINESS_TYPE || "BuyGoods",
    transCurrency: process.env.TELEBIRR_TRANS_CURRENCY || "ETB",
    timeoutExpress: (() => {
      const value = process.env.TELEBIRR_TIMEOUT_EXPRESS;
      if (!value) return "120m";
      return /^\d+m$/.test(value.trim()) ? value.trim() : "120m";
    })(),
    payeeIdentifierType: process.env.TELEBIRR_PAYEE_IDENTIFIER_TYPE || "04",
    payeeType: process.env.TELEBIRR_PAYEE_TYPE || "5000",
    includeRedirect,
    includeCallbackInfo: process.env.TELEBIRR_INCLUDE_CALLBACK_INFO === "true",
    privateKey,
    rejectUnauthorized,
    caCert,
  };
};

const defaultConfig = resolveChannelConfig();

module.exports = {
  ...defaultConfig,
  VALID_CHANNELS,
  getChannel,
  resolveChannelConfig,
};
