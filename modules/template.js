module.exports = (results) => `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta http-equiv="Content-Type" content="text/html;utf-8">
            <title>Japan Destinations 2019</title>
            <style>
                /* resets */
                * {
                    box-sizing: border-box;
                }
                html {
                    font-family: sans-serif;
                    font-size: 16px;
                }
                body {
                    padding: 0;
                    margin: 0;
                    font-weight: 400;
                    line-height: 1.45;
                    color: #333;
                    background-color: hsl(0, 0%, 95%);
                }
                section.main {
                    width: 100%;
                    max-width: 1000px;
                    margin: 0 auto;
                    background-color: hsl(0, 0%, 100%);
                    padding: 0 1em;
                    padding-top: 0.75em;
                    height: 100%;
                }
                /* typo: https://type-scale.com */
                p {margin-bottom: 1.25em;}
                h1, h2, h3, h4, h5 {
                    margin: 2.75rem 0 1rem;
                    font-family: 'Poppins', sans-serif;
                    font-weight: 400;
                    line-height: 1.15;
                }
                h1 {
                    margin-top: 0;
                    font-size: 2.488em;
                }
                h2 {font-size: 2.074em;}
                h3 {font-size: 1.728em;}
                h4 {font-size: 1.44em;}
                h5 {font-size: 1.2em;}
                small, .text_small {font-size: 0.833em;}
                /*custom*/
            </style>

            <!-- vanilla-datatables -->
            <link href="https://unpkg.com/vanilla-datatables@latest/dist/vanilla-dataTables.min.css" rel="stylesheet" type="text/css">
            <script src="https://unpkg.com/vanilla-datatables@latest/dist/vanilla-dataTables.min.js" type="text/javascript"></script>
        </head>
        <body>
            <section class="main">
                <h1>Japan Destinations 2019</h1>
                <table id="dataTable">

                </table>>
            </section>
            <script>
                'use strict';

                let dat = ${JSON.stringify(results)};
                const table = new DataTable(document.getElementById('dataTable'));
                table.insert(
                    {
                        headings: ['Short Name', 'Address', 'Price Level', 'Types', 'URL'],
                        data: dat.map((result) => {
                            return [
                                result.name || '',
                                result.formatted_address || '-',
                                result.price_level || '-',
                                result.types || '-',
                                '<a href="' + result.url + '">Map</a>'
                            ]
                        })
                    }
                );
            </script>
        </body>
    </html>
`;
