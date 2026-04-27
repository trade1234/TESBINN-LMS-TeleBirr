const express = require("express");

const {
  authTelebirrToken,
  createTelebirrOrder,
  telebirrMiniDebug,
  telebirrNotify,
} = require("../controllers/paymentController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/telebirr/auth-token", protect, authorize("student"), authTelebirrToken);
router.post("/telebirr/create-order", protect, authorize("student"), createTelebirrOrder);
router.post("/telebirr/mini-debug", protect, authorize("student"), telebirrMiniDebug);
router.all("/telebirr/notify", telebirrNotify);
router.all("/telebirr/notify*", telebirrNotify);

module.exports = router;
