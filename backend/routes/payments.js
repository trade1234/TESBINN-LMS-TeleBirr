const express = require("express");

const {
  createTelebirrOrder,
  telebirrNotify,
} = require("../controllers/paymentController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/telebirr/create-order", protect, authorize("student"), createTelebirrOrder);
router.post("/telebirr/notify", telebirrNotify);

module.exports = router;
