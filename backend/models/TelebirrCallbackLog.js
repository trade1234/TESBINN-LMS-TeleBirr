const mongoose = require("mongoose");

const TelebirrCallbackLogSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      trim: true,
      maxlength: 16,
    },
    url: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    contentType: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    merchOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    paymentOrderId: {
      type: String,
      trim: true,
    },
    tradeStatus: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    orderStatus: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    source: {
      type: String,
      enum: ["body", "query", "path", "empty"],
      default: "empty",
    },
    rawBody: {
      type: mongoose.Schema.Types.Mixed,
    },
    rawQuery: {
      type: mongoose.Schema.Types.Mixed,
    },
    rawPathParams: {
      type: mongoose.Schema.Types.Mixed,
    },
    parsedPayload: {
      type: mongoose.Schema.Types.Mixed,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TelebirrCallbackLog", TelebirrCallbackLogSchema);
