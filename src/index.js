import fs from 'fs';
import https, { Agent } from 'https';
import { parse } from 'csv';
import withinPolygon from 'robust-point-in-polygon';

const polygon = [];
const BASE_URL =
  'https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min/';

const isInsideAmazon = (point) => {
  switch (withinPolygon(polygon, point)) {
    case -1:
    case 0:
      return true;
    case 1:
      return false;
  }
};

async function downloadFile(url, targetFile) {
  return await new Promise((resolve, reject) => {
    const agent = new Agent({ rejectUnauthorized: false });
    https
      .get(url, { agent }, (response) => {
        const code = response.statusCode ?? 0;

        if (code >= 400) {
          return reject(new Error(response.statusMessage));
        }

        // save the file to disk
        const fileWriter = fs.createWriteStream(targetFile).on('finish', () => {
          resolve({});
        });

        response.pipe(fileWriter);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function readWildfiresFile() {
  fs.createReadStream('./src/wildfires/wildfires_example.csv')
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', function (row) {
      if (isInsideAmazon([row[0], row[1]])) {
        console.log(`( ${row[0]} ; ${row[1]} ) is inside Amazon`);
      } else {
        console.log(`( ${row[0]} ; ${row[1]} ) is NOT inside Amazon`);
      }
    })
    .on('end', function () {})
    .on('error', function (error) {
      console.log(error.message);
    });
}

fs.createReadStream('./src/amazon_coordinates.csv')
  .pipe(parse({ delimiter: ';', from_line: 2 }))
  .on('data', function (row) {
    const arr = row.map((data) => parseFloat(data));
    polygon.push(arr);
  })
  .on('end', async function () {
    try {
      await downloadFile(
        BASE_URL + 'focos_10min_20231111_1620.csv',
        './src/wildfires/wildfires_example.csv'
      );
      readWildfiresFile();
    } catch (error) {
      console.log(error);
    }
  })
  .on('error', function (error) {
    console.log(error.message);
  });
