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

const resolveChannelConfig = (channelInput) => {
  const channel = getChannel(channelInput);
  const baseUrl =
    process.env.TELEBIRR_BASE_URL || readChannelValue(channel, "BASE_URL", "TELEBIRR_BASE_URL");
  const webBaseUrl = readChannelValue(channel, "WEB_BASE_URL", "TELEBIRR_WEB_BASE_URL");
  const fabricAppId = process.env.TELEBIRR_FABRIC_APP_ID;
  const appSecret = process.env.TELEBIRR_APP_SECRET;
  const merchantAppId = readChannelValue(channel, "MERCHANT_APP_ID", "TELEBIRR_MERCHANT_APP_ID");
  const merchantCode = process.env.TELEBIRR_MERCHANT_CODE;
  const privateKey = normalizeKey(
    readChannelValue(channel, "PRIVATE_KEY", "TELEBIRR_PRIVATE_KEY")
  );
  const tradeType =
    process.env[`TELEBIRR_${channel.toUpperCase()}_TRADE_TYPE`] ||
    process.env.TELEBIRR_TRADE_TYPE ||
    (channel === "mini" ? "InApp" : "Checkout");
  const includeRedirect =
    process.env.TELEBIRR_INCLUDE_REDIRECT === "true" || tradeType !== "InApp";
  const otherParams =
    process.env[`TELEBIRR_${channel.toUpperCase()}_OTHER_PARAMS`] ||
    process.env.TELEBIRR_OTHER_PARAMS ||
    (tradeType === "InApp" ? "" : "&version=1.0&trade_type=Checkout");

  const requiredEnv = [
    ["TELEBIRR_BASE_URL", baseUrl],
    ["TELEBIRR_FABRIC_APP_ID", fabricAppId],
    ["TELEBIRR_APP_SECRET", appSecret],
    ["TELEBIRR_MERCHANT_APP_ID", merchantAppId],
    ["TELEBIRR_MERCHANT_CODE", merchantCode],
    ["TELEBIRR_PRIVATE_KEY", privateKey],
  ];

  if (tradeType !== "InApp") {
    requiredEnv.push(["TELEBIRR_WEB_BASE_URL", webBaseUrl]);
  }

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
    notifyUrl: process.env.TELEBIRR_NOTIFY_URL,
    redirectUrl: process.env.TELEBIRR_REDIRECT_URL,
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
    rejectUnauthorized: process.env.TELEBIRR_REJECT_UNAUTHORIZED !== "false",
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
