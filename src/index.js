import fs from 'fs';
import https, { Agent } from 'https';
import { parse } from 'csv';
import withinPolygon from 'robust-point-in-polygon';
import { format, isAfter } from 'date-fns';

import { INITIAL_DATE, allWildfires } from './state.js';
import { io } from './app.js';

const polygon = [];
const SATELLITE = 'GOES-16';
const MOCKED_INTERVAL = 2;
const INTERVAL_IN_MINUTES = 10;
const MOCKED = true;
const BASE_URL =
  'https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min/';

let timeStartDownloading;

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
  // Maybe I don't need to have a .csv with all wildfires...
  // console.log('Writing to all_wildfires.csv');

  // const writeStream = fs.createWriteStream('./src/all_wildfires.csv');
  // const columns = ['lat', 'lon', 'date', 'count'];
  // const stringifier = stringify({ header: true, columns });

  // allWildfires.forEach((row) => {
  //   stringifier.write(row);
  // });

  // stringifier.pipe(writeStream);
  // console.log('Finished writing data');

  try {
    await fs.promises.unlink('./src/downloaded.csv');
    console.log('Downloaded file deleted');
  } catch (error) {
    console.log('Error deleting downloaded file');
    console.log(error);
  }
}

function sendNewWildfiresCountToClient(newCount, oldCount) {
  const minutesInMilis =
    (MOCKED ? MOCKED_INTERVAL : INTERVAL_IN_MINUTES) * 60 * 1000;

  let i = 1;

  function increment() {
    if (i <= newCount) {
      const timeSpentUntilNow = Date.now() - timeStartDownloading;
      const dividend = i < newCount - 1 ? newCount - (i + 1) : 1; // prevent divisions by 0
      const interval = Math.floor(
        Math.abs(minutesInMilis - timeSpentUntilNow) / dividend
      );

      console.log(`Send count: `, oldCount + i);
      io.emit('new wildfires count', oldCount + i);
      i++;

      setTimeout(increment, interval < 0 ? 0 : interval);
    } else {
      console.log('Finished incrementing count');
    }
  }

  increment();
}

function updateAllWildfires(data) {
  console.log('Updating allWildfires');
  let newWildfiresCount = 0;
  const oldWilfiresCount = allWildfires.length;

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
      newWildfiresCount++;
    }
  });

  console.log('Finished updating data');
  console.log(
    `${newWildfiresCount} new lines added to allWildfires, ${
      data.length - newWildfiresCount
    } are duplicated`
  );
  sendNewWildfiresCountToClient(newWildfiresCount, oldWilfiresCount);
  writeAllWilfiresCSV();
}

function readWildfiresDownloaded() {
  const data = [];
  let linesDownloaded = 0;
  fs.createReadStream('./src/downloaded.csv')
    .pipe(
      parse({
        delimiter: ',',
        from_line: 2,
      })
    )
    .on('data', function (row) {
      linesDownloaded++;
      if (isInsideAmazon([row[0], row[1]]) && row[2] === SATELLITE) {
        // console.log(`( ${row[0]} ; ${row[1]} ) is inside Amazon`);
        row.splice(2, 1); // removing satellite column
        data.push(row);
      }
    })
    .on('end', function () {
      console.log(
        `${linesDownloaded} entries downloaded, which ${data.length} are inside Amazon and captured by ${SATELLITE}`
      );
      updateAllWildfires(data);
    })
    .on('error', function (error) {
      console.log(error.message);
    });
}

async function startDataFetch() {
  if (isAfter(Date.now(), INITIAL_DATE)) {
    timeStartDownloading = Date.now();
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

  setTimeout(startDataFetch, INTERVAL_IN_MINUTES * 60 * 1000);
}

let counter = 1;

async function mockedDataFetch() {
  counter++;
  timeStartDownloading = Date.now();
  try {
    await downloadFile(
      BASE_URL + `focos_10min_20231113_19${counter % 6}0.csv`,
      './src/downloaded.csv'
    );
    console.log('File downloaded successfully');
    readWildfiresDownloaded();
  } catch (error) {
    console.log(error);
  }

  setTimeout(mockedDataFetch, MOCKED_INTERVAL * 60 * 1000);
}

const loadAmazonBiome = () => {
  fs.createReadStream('./src/amazon_coordinates.csv')
    .pipe(parse({ delimiter: ';', from_line: 2 }))
    .on('data', function (row) {
      const arr = row.map((data) => parseFloat(data));
      polygon.push(arr);
    })
    .on('end', function () {
      console.log('Finished loading Amazon Biome');
      if (MOCKED) {
        mockedDataFetch();
      } else {
        startDataFetch();
      }
    })
    .on('error', function (error) {
      console.log(error.message);
    });
};

export { loadAmazonBiome };
