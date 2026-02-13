const https = require('https');
const { URL } = require('url');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');

// Make V8/TS linters happy in case of property assignment on Error in Node.
// (We only use this locally inside this module.)
/* eslint-disable no-underscore-dangle */

const fetchText = (url, timeoutMs = 10000, redirectsLeft = 3) =>
  new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xml;q=0.9,*/*;q=0.8',
          // Avoid compressed responses since we don't decompress here.
          'Accept-Encoding': 'identity',
        },
      },
      (res) => {
        // Follow redirects (YouTube can issue them, especially for consent/geo).
        if (
          res.statusCode &&
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          redirectsLeft > 0
        ) {
          const nextUrl = new URL(res.headers.location, url).toString();
          res.resume();
          fetchText(nextUrl, timeoutMs, redirectsLeft - 1).then(resolve).catch(reject);
          return;
        }

        if (res.statusCode && res.statusCode >= 400) {
          const err = new Error(`Request failed with status ${res.statusCode}`);
          err.statusCode = res.statusCode;
          reject(err);
          res.resume();
          return;
        }
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => resolve(data));
      }
    );

    request.on('error', reject);
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error('Request timed out'));
    });
  });

const decodeEntities = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractTagValue = (source, tagName) => {
  const tagMatch = source.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`));
  if (!tagMatch) return '';
  return decodeEntities(tagMatch[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim());
};

const extractChannelId = (html) => {
  const channelMatch =
    html.match(/"channelId":"(UC[a-zA-Z0-9_-]{20,})"/) ||
    html.match(/"externalId":"(UC[a-zA-Z0-9_-]{20,})"/);

  return channelMatch ? channelMatch[1] : null;
};

const parseFeed = (xml, limit) => {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  return entries.slice(0, limit).map((entryMatch) => {
    const entry = entryMatch[1];
    const videoId = extractTagValue(entry, 'yt:videoId');
    const title = extractTagValue(entry, 'title');
    const publishedAt = extractTagValue(entry, 'published');
    const description = extractTagValue(entry, 'media:description');
    const linkMatch = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/);
    const thumbMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);

    return {
      id: videoId,
      title,
      description,
      publishedAt,
      url: linkMatch ? linkMatch[1] : `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: thumbMatch ? thumbMatch[1] : '',
    };
  });
};

exports.getChannelVideos = asyncHandler(async (req, res, next) => {
  const handle = (req.query.handle || 'tradextv7').toString().replace(/^@/, '');
  const channelIdOverride = (req.query.channelId || '').toString().trim();
  const limit = Number.isFinite(Number(req.query.limit))
    ? Math.max(1, Math.min(24, Number(req.query.limit)))
    : 9;

  let channelId = null;

  // Optional bypass: if the environment cannot reach YouTube channel pages reliably,
  // callers can pass `channelId=UC...` directly to use the feed endpoint only.
  if (channelIdOverride) {
    if (!/^UC[a-zA-Z0-9_-]{20,}$/.test(channelIdOverride)) {
      return next(new ErrorResponse('Invalid channelId format.', 400));
    }
    channelId = channelIdOverride;
  } else {
    let channelHtml = '';
    try {
      channelHtml = await fetchText(`https://www.youtube.com/@${handle}`);
    } catch (err) {
      return next(
        new ErrorResponse(
          'Unable to fetch YouTube channel page. If this keeps failing, call this endpoint with ?channelId=UC... to bypass handle resolution.',
          502
        )
      );
    }
    channelId = extractChannelId(channelHtml);
  }

  if (!channelId) {
    return next(new ErrorResponse('Unable to resolve YouTube channel ID.', 404));
  }

  let feedXml = '';
  try {
    feedXml = await fetchText(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  } catch (err) {
    return next(new ErrorResponse('Unable to fetch YouTube video feed. Please try again later.', 502));
  }
  const videos = parseFeed(feedXml, limit).filter((video) => video.id);

  res.status(200).json({
    success: true,
    count: videos.length,
    data: videos,
  });
});
