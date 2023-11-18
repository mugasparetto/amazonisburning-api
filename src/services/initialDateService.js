import { allWildfires, initialDate, updateConfig } from '../state.js';
import {
  startDataFetch,
  tenMinuteTimer,
  incrementTimer,
  writeToCSV,
} from '../index.js';
import { io } from '../app.js';

const setInitialDate = async (req, res, next) => {
  const { year, month, day, hour, minutes } = req.body;

  allWildfires.length = 0;
  writeToCSV(allWildfires);
  io.emit('new wildfires count', 0);

  // month needs to have first capital letter
  // minutes should end with zero
  const dataToWrite = new Date(
    `${month} ${day}, ${year} ${hour}:${minutes}:00`
  );
  updateConfig({
    key: 'initial_date',
    data: dataToWrite,
  });
  console.log(`NEW INITIAL DATE: ${initialDate}`);
  clearTimeout(tenMinuteTimer);
  clearTimeout(incrementTimer);
  startDataFetch();

  if (!year || !month || !day || !hour || !minutes) {
    return next(
      new Error(
        'req.body should have the following format {year, month, day, hour, minutes}'
      )
    );
  }

  res.send(`${month} ${day}, ${year} ${hour}:${minutes}:00`);
};

export default { setInitialDate };
