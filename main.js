'use strict';

require('dotenv').config();

const {google} = require('googleapis');
const authorize = require('./modules/auth');
const fs = require('fs');
const request = require('request-promise-native');

// Get sheet data from destination form sheet
function getSheetData(auth) {
    return new Promise((resolve, reject) => {
        const sheets = google.sheets({version: 'v4', auth});
        sheets.spreadsheets.values.get(
            {
                spreadsheetId: '1_Z8PhD6A0TjANT6yNr1nFcAVNMUpS1kKm3MTWV4sQ50',
                range: 'Form Responses 1!A2:D'
            }
            , (err, res) => {
                if (err) return reject(err);
                resolve(res.data.values);
            }
        );
    });
}

// Seeing as we only need the api key for the place search
// stuff, just use request module.
function search(title) {
    return request(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${title + ' Japan'}&key=${process.env.API_KEY}&inputtype=textquery`
    )
}

function createSave(title) {
    console.log(`writing ${title}.json`);

    return new Promise(
        async (resolve, reject) => {

        let placeSearch;
        try {
            placeSearch = await search(title);
        }
        catch (err) {
            console.log(`error occurred for place search with input = ${title}`);
            return reject();
        }
        if (placeSearch) {
            fs.writeFile(`./saves/${title}.json`, placeSearch, function(err) {
                if (err) throw err;
                resolve(placeSearch);
            });
        } else {
            reject(`bad place search result for ${title}`);
        }
    });
}

function getDetails(id) {
    console.log({id});
    return new Promise(
        async (resolve, reject) => {

            let listing = await getSavesListing();
            if (!listing.includes(`${id}.json`)) {
                console.log(`no detail for ${id}... fetching and saving to disk`)
                let detail = await (request(
                    `https://maps.googleapis.com/maps/api/place/details/json?placeid=${id}&key=${process.env.API_KEY}`
                ))
                fs.writeFile(`./data/saves/${id}.json`, detail, function(err) {
                    if (err) return reject(err);
                    resolve(detail);
                })
            }
            else {
                fs.readFile(`./data/saves/${id}.json`, function (err, dat) {
                    if (err) return reject(err);
                    resolve(dat)
                })
            }
    })
}

function getPlaceIds() {
    return new Promise(
        (resolve, reject) => {

        fs.readFile('./data/place_ids.txt', function(err, data) {
            if (err) return reject(err);
            resolve(data.toString().split(','));
        })
    })
}

function getSavesListing() {
    return new Promise(
        (resolve, reject) => {

        fs.readdir('./data/saves/', function(err, files) {
            if (err) return reject(err);
            resolve(files);
        })
    })
}


// EXEC
authorize(async function(auth) {

    // SHEETS
    let sheetData;
    try {
        console.log('fetching sheet data...')
        sheetData = await getSheetData(auth);
    }
    catch (err) {
        console.error('error fetching data.', err);
        return;
    }

    let placeIds;
    try {
        placeIds = await getPlaceIds();
    }
    catch (err) {
        console.error('error reading place ids.', err);
        return;
    }

    let details = [];
    sheetData
            .forEach(async (row) => {

                // corresponding to each column of the row
                let timestamp, title, description, type;

                timestamp   = row[0]; // form entry submitted
                title       = row[1];
                description = row[2];
                type        = row[3];

                let detail, id;
                if (!( id = placeIds.find(id => id.split(':')[0] === title) )) {
                    // let detailDat = await getDetails(id); 
                    // detail = JSON.parse(detailDat).result;
                    let idSearch = await search(title), placeId = `${title}:${JSON.parse(idSearch).candidates[0].place_id}`;
                    placeIds.push(
                        placeId
                    )
                    id = placeId;
                }
                detail = JSON.parse(await getDetails(id.split(':')[1])).result;
                details.push(
                    `
                    <div class="location">
                        <h2>${title}</h2>
                        <p>${detail.formatted_address}</p>
                        <iframe width="600" height="450" frameborder="0" style="border:0" src="https://www.google.com/maps/embed/v1/place?q=place_id:${detail.place_id}&key=${process.env.API_KEY}" allowfullscreen></iframe>
                        <p>${description}</p>
                    </div>
                    `
                );
        });
    

    // Ya, ya I know its bad but I'm in a hurry
    setTimeout(() => {

        console.log(`${details.length} details fetched`);

        // SAVE NEW LIST OF PLACE_IDS
        fs.writeFile('./data/place_ids.txt', placeIds, function (err) {
            if (err) {
                console.error('could not write to place_ids.txt', err);
            }
        })
    
        Promise.all(details)
            .then((results) => {
                
                // GENERATE THE HTML DOC PAGE
                fs.writeFile('./public/index.html', require('./modules/template')(results)
                , function(err) {
                    if (err) throw err;
                    console.log('wrote to ./public/index.html');
                })
            })

    }
    , 3000); // wait 3 seconds for detail requests

});