import fs from 'fs';
import https, { Agent } from 'https';
import { parse, stringify } from 'csv';
import withinPolygon from 'robust-point-in-polygon';
import { format, isAfter } from 'date-fns';

const polygon = [];
const BASE_URL =
  'https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min/';
const INITIAL_DATE = new Date('November 12, 2023 01:00:00');

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
    console.log('Downloading file: ' + url);

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

async function writeToAllWildfires(data) {
  console.log('Writing to all_wildfires.csv');

  const writeStream = fs.createWriteStream('./src/all_wildfires.csv', {
    flags: 'a',
  });

  const stringifier = stringify({ header: false });

  data.forEach((row) => stringifier.write(row));
  stringifier.pipe(writeStream);
  console.log('Finished writing data');

  try {
    await fs.promises.unlink('./src/downloaded.csv');
    console.log('Downloaded file deleted');
  } catch (error) {
    console.log('Error deleting downloaded file');
    console.log(error);
  }
}

function readWildfiresDownloaded() {
  const data = [];
  fs.createReadStream('./src/downloaded.csv')
    .pipe(parse({ delimiter: ',', from_line: 2 }))
    .on('data', function (row) {
      if (isInsideAmazon([row[0], row[1]])) {
        console.log(`( ${row[0]} ; ${row[1]} ) is inside Amazon`);
        data.push(row);
      } else {
      }
    })
    .on('end', function () {
      writeToAllWildfires(data);
    })
    .on('error', function (error) {
      console.log(error.message);
    });
}

async function startDataFetch() {
  if (isAfter(Date.now(), INITIAL_DATE)) {
    console.log('Now is after INITIAL DATE');
    const date = format(Date.now(), 'yyyyMMdd_HHmm').replace(/.$/, '0');
    try {
      await downloadFile(
        BASE_URL + `focos_10min_${date}.csv`,
        './src/downloaded.csv'
      );
      console.log('File downloaded successfully');
      readWildfiresDownloaded();
    } catch (error) {
      console.log(error);
    }
  } else {
    console.log('Now is before INITIAL DATE');
  }

  const minutes = 10;
  setTimeout(startDataFetch, minutes * 60 * 1000);
}

fs.createReadStream('./src/amazon_coordinates.csv')
  .pipe(parse({ delimiter: ';', from_line: 2 }))
  .on('data', function (row) {
    const arr = row.map((data) => parseFloat(data));
    polygon.push(arr);
  })
  .on('end', function () {
    startDataFetch();
  })
  .on('error', function (error) {
    console.log(error.message);
  });
