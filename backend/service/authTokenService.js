const https = require("https");
const tools = require("../utils/telebirrTools");
const configModule = require("./config");

const logJson = (label, value) => {
  const payload = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  console.log(`[Telebirr] ${label}: ${payload}`);
};

const postJson = (url, headers, body, configOverride) =>
  new Promise((resolve, reject) => {
    const config = configOverride || configModule;
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

    logJson("AuthToken Request URL", url);
    logJson("AuthToken Request Headers", options.headers);
    logJson("AuthToken Request Body", body);

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
          logJson("AuthToken Response Status", res.statusCode || "unknown");
          logJson("AuthToken Response Body", parsedBody);
          resolve(parsedBody);
        } catch (err) {
          reject(new Error(`Invalid JSON response: ${raw}`));
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

const createRequestObject = (accessToken, config) => {
  const req = {
    timestamp: tools.createTimeStamp(),
    nonce_str: tools.createNonceStr(),
    method: "payment.authtoken",
    version: "1.0",
  };

  req.biz_content = {
    appid: config.merchantAppId,
    access_token: accessToken,
    trade_type: "InApp",
    resource_type: "OpenId",
  };
  req.sign = tools.signRequestObject(req, config.privateKey);
  req.sign_type = "SHA256WithRSA";

  return req;
};

const requestAuthToken = (fabricToken, accessToken, configOverride) => {
  const config = configOverride || configModule;
  const reqObject = createRequestObject(accessToken, config);

  return postJson(
    `${config.baseUrl}/payment/v1/auth/authToken`,
    { "X-APP-Key": config.fabricAppId, Authorization: fabricToken },
    reqObject,
    config
  );
};

module.exports = {
  requestAuthToken,
};
