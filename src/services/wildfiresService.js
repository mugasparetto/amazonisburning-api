import { allWildfires } from '../state.js';

const getWildfires = async (req, res, next) => {
  res.send(allWildfires);
};

export default { getWildfires };
