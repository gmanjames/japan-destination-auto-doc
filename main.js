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

function getPhoto(photoref) {
    return request(
        `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photoref}&key=${process.env.API_KEY}&maxwidth=400`,
        {
            encoding: 'base64'
        }
    )
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
                fs.writeFile(`./data/saves/${id}.json`, detail, {encoding: 'utf-8'}, function(err) {
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

function getListing(dir) {
    return new Promise(
        (resolve, reject) => {

        fs.readdir(dir, function(err, files) {
            if (err) return reject(err);
            resolve(files);
        })
    })
}

function getPhotosListing() {
    return getListing('./data/photos');
}

function getSavesListing() {
    return getListing('./data/saves/');
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
                    detail
                );
        });
    

    // Ya, ya I know its bad but I'm in a hurry
    setTimeout(() => {

        console.log(`${details.length} details fetched`);

        // SAVE NEW LIST OF PLACE_IDS
        fs.writeFile('./data/place_ids.txt', placeIds, {encoding: 'utf-8'}, function (err) {
            if (err) {
                console.error('could not write to place_ids.txt', err);
            }
        })
    
        Promise.all(details)
            .then(async (results) => {
                
                // SAVE PHOTOS IF NONE FOR PLACE
                let listing = await getPhotosListing();
                results.
                    forEach(async (result) => {
                        if (!listing.includes(result.place_id)) {
                            console.log(`fetching images for ${result.place_id}`)
                            let dir = `./data/photos/${result.place_id}`;
                            fs.mkdir(dir, function (err) {
                                if (err) throw err;
                                if (result.photos.length > 0) {
                                    let slice = result.photos.slice(0, 5);
                                    for (let i in slice) {
                                        let photo = slice[i];
                                        getPhoto(photo.photo_reference).then(function(photoDat) {
                                            fs.writeFile(`${dir}/${result.place_id}_${i}.jfif`, photoDat.toString(), 'base64', function (err) {
                                                if (err) {
                                                    console.error(`could not create photo`, err)
                                                }
                                            })
                                        })
                                    }
                                }
                            })
                        }
                    })
                            

                // FINALLY GENERATE THE HTML DOC PAGE
                fs.writeFile('./public/index.html', require('./modules/template')(results)
                , function(err) {
                    if (err) throw err;
                    console.log('wrote to ./public/index.html');
                })
            })

    }
    , 3000); // wait 3 seconds for detail requests

});