'use strict';

const {google} = require('googleapis');
const authorize = require('./modules/auth');
const {insertTableRow} = require('./modules/table');

// Get sheet data from destination form sheet
function getSheetData(auth) {
    return new Promise((resolve, reject) => {
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.get(
            {
                spreadsheetId: '1_Z8PhD6A0TjANT6yNr1nFcAVNMUpS1kKm3MTWV4sQ50',
                range: 'Form Responses 1!A:D'
            }
            , (err, res) => {
                if (err) return reject(err);
                resolve(res.data.values);
            }
        );
    });
}

// Get document data from google doc
function getDocumentData(auth) {
    return new Promise((resolve, reject) => {
        const docs = google.docs({version: "v1", auth});
        docs.documents.get(
            {
            "documentId": "1JHnwLFcdxSx21CXzcwJkxqmqRdAamzQedRaylg9VmYQ"
            }
            , (err, res) => {
                if (err) return reject(err);
                resolve(res.data);
            })
    })
}

function updateDocument(requests, auth) {
    const docs = google.docs({version: "v1", auth});
    docs.documents.batchUpdate({
        documentId: "1JHnwLFcdxSx21CXzcwJkxqmqRdAamzQedRaylg9VmYQ",
        requestBody: {requests}
    })
    .then(function(result) {
        console.log('update success');
    }).catch(function(err) {
        console.log(err.response);
    })
}

// EXEC
authorize(async function(auth) {

    // SHEETS
    let sheetData, docData;
    try {
        console.log('fetching data...')
        sheetData = await getSheetData(auth);
        docData = await getDocumentData(auth);
    }
    catch (err) {
        console.error('error fetching data.', err);
        return;
    }

    // grab table row count to determine sheets offset
    let skip = docData.body.content.find((item) => item.table).table.rows;
    
    // batch update to google doc
    // only inserts empty rows atm
    // need to populate columns with data from sheet
    const requests = [];
    sheetData.slice(skip-1).forEach((row) => {
        // DON'T ASK ABOUT THE 57 RN
        requests.push(insertTableRow(true, 57, skip-1));
    })

    if (requests.length > 0) {
        console.log(`found ${sheetData.slice(skip-1).length} new entries...`)
        updateDocument(requests, auth);
    } else {
        console.log('no new entries.');
    }
});