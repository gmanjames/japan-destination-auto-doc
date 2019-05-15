'use strict';

// MODULES
const fs = require('fs');
const readline = require('readline');
const authConfig = require('./authConfig')
const {google} = require('googleapis');

// UTIL FUNCTIONS
const getClient = () => new google.auth.OAuth2(authConfig.clientId, authConfig.clientSecret, authConfig.redirectUris[0]);
const getAuthUrl = client => client.generateAuthUrl({access_type: "offline", scope: authConfig.scopes.join(' ')});
const getInterface = () => readline.createInterface({input: process.stdin, output: process.stdout});

function createQuestion(q, cb)  {
    const r1 = getInterface();
    r1.question(q, function() {
        r1.close();
        cb(...arguments);
    });
};

// CONST VALUES
const TOKEN_PATH = 'token.json';

function authorize(callback) {
    const oAuth2Client = getClient();
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = getAuthUrl(oAuth2Client);
    console.log('Authorize this app by visiting this url:', authUrl);
    createQuestion('Enter the code from that page here: ', (code) => {
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error while trying to retrieve access token', err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
}

module.exports = authorize;