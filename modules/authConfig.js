require('dotenv').config();

module.exports = {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    apiKey: process.env.API_KEY,
    redirectUris: ['urn:ietf:wg:oauth:2.0:oob'],
    scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/spreadsheets.readonly'
    ],
}