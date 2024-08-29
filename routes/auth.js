const express = require('express');
const { loginSpotify, spotifyCallback, loginGoogle, googleCallback } = require('../controllers/authController');
const router = express.Router();

router.get('/spotify', loginSpotify);
router.get('/spotify/callback', spotifyCallback);
router.get('/google', loginGoogle);
router.get('/google/callback', googleCallback);

module.exports = router;
