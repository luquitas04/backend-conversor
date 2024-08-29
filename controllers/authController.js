const { google } = require('googleapis');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:4000/auth/google/callback',
});

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

exports.loginSpotify = (req, res) => {
    const scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'];
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
    res.redirect(authorizeURL);
};

exports.spotifyCallback = async (req, res) => {
    const code = req.query.code || null;

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const accessToken = data.body['access_token'];
        res.redirect(`http://localhost:5173/?spotifyAccessToken=${accessToken}`);
    } catch (err) {
        console.error('Error retrieving Spotify access token', err);
        res.redirect('/');
    }
};

exports.loginGoogle = (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/youtube'];
    const authorizeURL = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    res.redirect(authorizeURL);
};

exports.googleCallback = async (req, res) => {
    const code = req.query.code || null;

    try {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        const googleAccessToken = tokens.access_token;
        res.redirect(`http://localhost:5173/?googleAccessToken=${googleAccessToken}`);
    } catch (err) {
        console.error('Error retrieving Google access token', err);
        res.redirect('/');
    }
};

