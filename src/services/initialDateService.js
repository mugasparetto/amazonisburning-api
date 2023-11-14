import { allWildfires, initialDate, updateDate } from '../state.js';
import { startDataFetch, tenMinuteTimer } from '../index.js';

const setInitialDate = async (req, res, next) => {
  const { year, month, day, hour, minutes } = req.body;

  allWildfires.length = 0;

  // month needs to have first capital letter
  // minutes should end with zero
  // initialDate = new Date('November 14, 2023 20:50:00');
  updateDate(`${month} ${day}, ${year} ${hour}:${minutes}:00`);
  console.log(`NEW INITIAL DATE: ${initialDate}`);
  clearTimeout(tenMinuteTimer);
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
