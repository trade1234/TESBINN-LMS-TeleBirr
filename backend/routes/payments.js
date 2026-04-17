const express = require("express");

const {
  authTelebirrToken,
  createTelebirrOrder,
  telebirrNotify,
} = require("../controllers/paymentController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/telebirr/auth-token", protect, authorize("student"), authTelebirrToken);
router.post("/telebirr/create-order", protect, authorize("student"), createTelebirrOrder);
router.all("/telebirr/notify", telebirrNotify);
router.all("/telebirr/notify*", telebirrNotify);

module.exports = router;
