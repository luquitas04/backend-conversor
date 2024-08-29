const { google } = require('googleapis');
const SpotifyWebApi = require('spotify-web-api-node');
require('dotenv').config();

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const getSpotifyToken = async () => {
    try {
        const data = await spotifyApi.clientCredentialsGrant();
        spotifyApi.setAccessToken(data.body['access_token']);
    } catch (err) {
        console.error('Error al obtener el token de acceso', err);
        throw err;
    }
};

const searchYouTube = async (oauth2Client, query) => {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const response = await youtube.search.list({
        part: 'snippet',
        q: query,
        maxResults: 1,
        type: 'video',
    });
    return response.data.items.length > 0
        ? `https://www.youtube.com/watch?v=${response.data.items[0].id.videoId}`
        : null;
};

const createYouTubePlaylist = async (oauth2Client, playlistName, videoUrls) => {
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const playlistResponse = await youtube.playlists.insert({
        part: 'snippet,status',
        requestBody: {
            snippet: {
                title: playlistName,
                description: 'Playlist creada usando OAuth2',
            },
            status: {
                privacyStatus: 'public',
            },
        },
    });

    const playlistId = playlistResponse.data.id;

    for (const videoUrl of videoUrls) {
        if (videoUrl) {
            const videoId = videoUrl.split('v=')[1];
            await youtube.playlistItems.insert({
                part: 'snippet',
                requestBody: {
                    snippet: {
                        playlistId: playlistId,
                        resourceId: {
                            kind: 'youtube#video',
                            videoId: videoId,
                        },
                    },
                },
            });
        }
    }

    return `https://www.youtube.com/playlist?list=${playlistId}`;
};

exports.convertPlaylist = async (req, res) => {
    const { spotifyPlaylistUrl, googleAccessToken } = req.body;

    try {
        await getSpotifyToken();

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: googleAccessToken });

        const playlistId = spotifyPlaylistUrl.split('/playlist/')[1].split('?')[0];
        const data = await spotifyApi.getPlaylistTracks(playlistId, {
            fields: 'items(track(name, artists(name)))',
        });

        const tracks = data.body.items.map((item) => {
            const track = item.track;
            const artistNames = track.artists.map((artist) => artist.name).join(', ');
            return `${track.name} - ${artistNames}`;
        });

        const youtubeLinksPromises = tracks.map((track) => searchYouTube(oauth2Client, track));
        const youtubeLinks = await Promise.all(youtubeLinksPromises);

        const youtubePlaylistUrl = await createYouTubePlaylist(oauth2Client, 'Converted Playlist', youtubeLinks);

        res.status(200).json({ youtubePlaylistUrl });
    } catch (err) {
        console.error('Error al convertir la playlist', err);
        res.status(500).json({ error: 'An error occurred while converting the playlist.' });
    }
};
