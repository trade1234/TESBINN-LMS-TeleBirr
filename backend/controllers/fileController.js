const crypto = require("crypto");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const s3Region = process.env.AWS_REGION || process.env.S3_REGION;
const s3Bucket = process.env.S3_BUCKET;
const s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
const s3KeyPrefix = process.env.S3_KEY_PREFIX || "lesson-";
const s3Endpoint = process.env.S3_ENDPOINT;
const s3ForcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";

const s3Client = new S3Client({
  region: s3Region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
  endpoint: s3Endpoint || undefined,
  forcePathStyle: s3Endpoint ? s3ForcePathStyle : undefined,
});

const getPublicBaseUrl = () => {
  if (s3PublicBaseUrl) {
    return s3PublicBaseUrl.replace(/\/+$/, "");
  }
  if (!s3Bucket || !s3Region) {
    return null;
  }
  return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;
};

const uploadToAppwrite = asyncHandler(async (req, res, next) => {
  const file = req.file;
  if (!file) {
    return next(new ErrorResponse("File upload required", 400));
  }
  console.log("uploadToAppwrite file size (bytes):", file.size);

  if (!s3Bucket || !s3Region) {
    return next(new ErrorResponse("S3 storage is not configured", 500));
  }

  const uuid = crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : crypto.randomBytes(16).toString("hex");
  const fileId = `${s3KeyPrefix}${uuid.slice(0, 28)}`;

  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: fileId,
    Body: file.buffer,
    ContentType: file.mimetype || "application/octet-stream",
  });

  let uploadResult;
  try {
    uploadResult = await s3Client.send(command);
  } catch (error) {
    return next(
      new ErrorResponse(
        `S3 upload failed: ${error.message || "unknown error"}`,
        500,
      ),
    );
  }

  const baseUrl = getPublicBaseUrl();
  const viewUrl = baseUrl ? `${baseUrl}/${encodeURIComponent(fileId)}` : null;

  res.status(200).json({
    success: true,
    data: {
      key: fileId,
      bucket: s3Bucket,
      etag: uploadResult?.ETag,
      viewUrl,
    },
  });
});

module.exports = {
  uploadToAppwrite,
};
