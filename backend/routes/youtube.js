const express = require('express');
const { getChannelVideos } = require('../controllers/youtubeController');

const router = express.Router();

router.get('/videos', getChannelVideos);

module.exports = router;
