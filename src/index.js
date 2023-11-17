import fs from 'fs';
import https, { Agent } from 'https';
import { parse } from 'csv';
import withinPolygon from 'robust-point-in-polygon';
import { format, isAfter } from 'date-fns';
import storage from 'node-persist';

import { initialDate, allWildfires, initializeState } from './state.js';
import { io } from './app.js';

const polygon = [];
const SATELLITE = 'GOES-16';
const MOCKED_INTERVAL = 0.5;
const INTERVAL_IN_MINUTES = 10;
const MOCKED = false;
const BASE_URL =
  'https://dataserver-coids.inpe.br/queimadas/queimadas/focos/csv/10min/';

let timeStartDownloading;
let tenMinuteTimer;

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
  for (let i = 0; i < allWildfires.length; i++) {
    const wildFiresLocation = allWildfires[i].slice(0, 2); // selects only lat, long
    if (arraysEqual(wildFiresLocation, obj)) {
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
      const interval = Math.floor(
        Math.abs(minutesInMilis - timeSpentUntilNow) / (newCount - (i - 1))
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
    const exists = locationExists(location);
    if (exists || exists === 0) {
      // exists could be 0, which is falsy. I need to check if it is 0
      const [lat, long, date, count] = allWildfires[exists];
      const newRow = [lat, long, date, count + 1];
      allWildfires[exists] = newRow;
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
  if (isAfter(Date.now(), initialDate)) {
    timeStartDownloading = Date.now();
    console.log('Now is after INITIAL DATE');
    const date = format(Date.now(), 'yyyyMMdd_HHmm').replace(/.$/, '0');
    try {
      await downloadFile(
        MOCKED
          ? BASE_URL + `focos_10min_20231116_1000.csv`
          : BASE_URL + `focos_10min_${date}.csv`,
        './src/downloaded.csv'
      );
      console.log('File downloaded successfully');
      readWildfiresDownloaded();
      tenMinuteTimer = setTimeout(
        startDataFetch,
        (MOCKED ? MOCKED_INTERVAL : INTERVAL_IN_MINUTES) * 60 * 1000
      );
    } catch (error) {
      console.log(error);
      clearTimeout(tenMinuteTimer);
      setTimeout(startDataFetch, 1 * 60 * 1000); // if file was not found, try again 2 minutes later
    }
  } else {
    console.log(`Now is before INITIAL DATE ${initialDate}`);
    tenMinuteTimer = setTimeout(
      startDataFetch,
      INTERVAL_IN_MINUTES * 60 * 1000
    );
  }
}

const loadAmazonBiome = () => {
  fs.createReadStream('./src/amazon_coordinates.csv')
    .pipe(parse({ delimiter: ';', from_line: 2 }))
    .on('data', function (row) {
      const arr = row.map((data) => parseFloat(data));
      polygon.push(arr);
    })
    .on('end', async function () {
      console.log('Finished loading Amazon Biome');
      try {
        await storage.init({});
        await initializeState();
        startDataFetch();
      } catch (error) {
        console.log(error);
      }
    })
    .on('error', function (error) {
      console.log(error.message);
    });
};

export { loadAmazonBiome, startDataFetch, tenMinuteTimer };
