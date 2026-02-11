const ErrorResponse = require('../utils/errorResponse');

const toPositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.connection?.remoteAddress || 'unknown';
};

const createWindowLimiter = ({ windowMs, max }) => {
  const bucket = new Map();

  return (key) => {
    const now = Date.now();
    const entry = bucket.get(key);

    if (!entry || entry.resetAt <= now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      bucket.set(key, fresh);
      return { blocked: false, remaining: Math.max(max - 1, 0), resetAt: fresh.resetAt };
    }

    entry.count += 1;
    const blocked = entry.count > max;
    return { blocked, remaining: Math.max(max - entry.count, 0), resetAt: entry.resetAt };
  };
};

const registerLimiter = createWindowLimiter({
  windowMs: toPositiveInt(process.env.REGISTER_RATE_WINDOW_MS, 15 * 60 * 1000),
  max: toPositiveInt(process.env.REGISTER_RATE_MAX, 5)
});

const loginLimiter = createWindowLimiter({
  windowMs: toPositiveInt(process.env.LOGIN_RATE_WINDOW_MS, 15 * 60 * 1000),
  max: toPositiveInt(process.env.LOGIN_RATE_MAX, 10)
});

const setRateLimitHeaders = (res, meta) => {
  const retryAfterSeconds = Math.max(Math.ceil((meta.resetAt - Date.now()) / 1000), 1);
  res.setHeader('Retry-After', retryAfterSeconds);
};

const setStandardRateHeaders = (res, meta, limit) => {
  res.setHeader('X-RateLimit-Limit', String(limit));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(meta.remaining, 0)));
  res.setHeader('X-RateLimit-Reset', String(meta.resetAt));
};

exports.limitRegistrationAttempts = (req, res, next) => {
  const ip = getClientIp(req);
  const result = registerLimiter(ip);
  const max = toPositiveInt(process.env.REGISTER_RATE_MAX, 5);

  setStandardRateHeaders(res, result, max);

  if (result.blocked) {
    setRateLimitHeaders(res, result);
    return next(new ErrorResponse('Too many registration attempts. Try again later.', 429));
  }

  return next();
};

exports.limitLoginAttemptsByIp = (req, res, next) => {
  const ip = getClientIp(req);
  const result = loginLimiter(ip);
  const max = toPositiveInt(process.env.LOGIN_RATE_MAX, 10);

  setStandardRateHeaders(res, result, max);

  if (result.blocked) {
    setRateLimitHeaders(res, result);
    return next(new ErrorResponse('Too many login attempts. Try again later.', 429));
  }

  return next();
};
