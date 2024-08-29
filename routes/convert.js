const express = require('express');
const { convertPlaylist } = require('../controllers/convertController');
const router = express.Router();

router.post('/convert', convertPlaylist);

module.exports = router;
