import fs from 'fs';
import { parse } from 'csv';
import withinPolygon from 'robust-point-in-polygon';

const polygon = [];

const isInsideAmazon = (point) => {
  switch (withinPolygon(polygon, point)) {
    case -1:
    case 0:
      return true;
    case 1:
      return false;
  }
};

function readFiresFile() {
  fs.createReadStream('./src/fires_example.csv')
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
  .on('end', function () {
    readFiresFile();
  })
  .on('error', function (error) {
    console.log(error.message);
  });
