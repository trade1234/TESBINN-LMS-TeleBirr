const crypto = require("crypto");

const EXCLUDE_FIELDS = new Set([
  "sign",
  "sign_type",
  "header",
  "refund_info",
  "openType",
  "raw_request",
  "biz_content",
  "wallet_reference_data",
]);

const createTimeStamp = () => Math.floor(Date.now() / 1000).toString();

const createNonceStr = () =>
  crypto.randomBytes(16).toString("hex").slice(0, 32);

const signString = (text, privateKey) => {
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(text);
  signer.end();
  return signer.sign(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: 32,
    },
    "base64"
  );
};

const signRequestObject = (requestObject, privateKey) => {
  const fields = [];
  const fieldMap = {};

  Object.keys(requestObject).forEach((key) => {
    if (EXCLUDE_FIELDS.has(key)) return;
    fields.push(key);
    fieldMap[key] = requestObject[key];
  });

  if (requestObject.biz_content) {
    Object.keys(requestObject.biz_content).forEach((key) => {
      if (EXCLUDE_FIELDS.has(key)) return;
      fields.push(key);
      fieldMap[key] = requestObject.biz_content[key];
    });
  }

  fields.sort();
  const signOriginStr = fields.map((key) => `${key}=${fieldMap[key]}`).join("&");
  console.log(`[Telebirr] Sign String: ${signOriginStr}`);
  return signString(signOriginStr, privateKey);
};

module.exports = {
  createTimeStamp,
  createNonceStr,
  signRequestObject,
};
