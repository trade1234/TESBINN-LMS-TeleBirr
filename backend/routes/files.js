const express = require("express");
const multer = require("multer");
const { protect, authorize } = require("../middleware/auth");
const { uploadToAppwrite } = require("../controllers/fileController");

const router = express.Router();

const maxUploadBytes = Number(process.env.MAX_FILE_UPLOAD || "500000000");
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
  },
});

router.use(protect);
router.use(authorize("teacher", "admin"));

router.post("/appwrite", upload.single("file"), uploadToAppwrite);

module.exports = router;
