const https = require("https");
const configModule = require("./config");

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

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => {
        raw += chunk;
      });
      res.on("end", () => {
        console.log("[Telebirr] raw token response:", raw);
        if (!raw) {
          reject(new Error("Empty response from Telebirr"));
          return;
        }
        try {
          resolve(JSON.parse(raw));
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

 function applyFabricToken(configOverride) {
  const config = configOverride || configModule;
  return postJson(
    `${config.baseUrl}/payment/v1/token`,
    { "X-APP-Key": config.fabricAppId },
    { appSecret: config.appSecret },
    config
  );
}

module.exports = applyFabricToken;
