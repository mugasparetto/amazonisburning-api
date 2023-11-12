import fs from 'fs';
import https, { Agent } from 'https';
import { parse, stringify } from 'csv';
import withinPolygon from 'robust-point-in-polygon';
import { format, isAfter } from 'date-fns';

const polygon = [];
const allWildfires = [];
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

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function locationExists(obj) {
  var i;
  for (i = 0; i < allWildfires.length; i++) {
    const allWildFiresLocation = allWildfires[i].slice(0, 2); // selects only lat, long
    if (arraysEqual(allWildFiresLocation, obj)) {
      return i;
    }
  }

  return false;
}

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

async function writeAllWilfiresCSV() {
  console.log('Writing to all_wildfires.csv');

  const writeStream = fs.createWriteStream('./src/all_wildfires.csv');
  const columns = ['lat', 'lon', 'date', 'count'];
  const stringifier = stringify({ header: true, columns });

  allWildfires.forEach((row) => {
    stringifier.write(row);
  });

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

function updateAllWildfires(data) {
  console.log('Updating allWildfires');

  data.forEach((row) => {
    const location = row.slice(0, 2); // selects only lat, long
    if (locationExists(location)) {
      const index = locationExists(location);
      const [lat, long, date, count] = allWildfires[index];
      const newRow = [lat, long, date, count + 1];

      allWildfires[index] = newRow;
    } else {
      row[3] = 1; // adding count
      allWildfires.push(row);
    }
  });

  console.log('Finished updating data');
  writeAllWilfiresCSV();
}

function readWildfiresDownloaded() {
  const data = [];
  fs.createReadStream('./src/downloaded.csv')
    .pipe(
      parse({
        delimiter: ',',
        from_line: 2,
      })
    )
    .on('data', function (row) {
      if (isInsideAmazon([row[0], row[1]])) {
        console.log(`( ${row[0]} ; ${row[1]} ) is inside Amazon`);
        row.splice(2, 1); // removing satellite column
        data.push(row);
      } else {
      }
    })
    .on('end', function () {
      updateAllWildfires(data);
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

let counter = 0;

async function mockedDataFetch() {
  counter++;
  try {
    await downloadFile(
      counter === 1
        ? BASE_URL + `focos_10min_20231112_0110.csv`
        : BASE_URL + `focos_10min_20231112_0120.csv`,
      './src/downloaded.csv'
    );
    console.log('File downloaded successfully');
    readWildfiresDownloaded();
  } catch (error) {
    console.log(error);
  }

  setTimeout(mockedDataFetch, 10 * 1000);
}

fs.createReadStream('./src/amazon_coordinates.csv')
  .pipe(parse({ delimiter: ';', from_line: 2 }))
  .on('data', function (row) {
    const arr = row.map((data) => parseFloat(data));
    polygon.push(arr);
  })
  .on('end', function () {
    mockedDataFetch();
  })
  .on('error', function (error) {
    console.log(error.message);
  });
