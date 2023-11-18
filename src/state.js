import storage from 'node-persist';
import { parseISO } from 'date-fns';

import { getInitialState } from './octokit.js';

const allWildfires = [];
var initialDate;

initialDate = new Date('December 5, 2023 09:00:00');

async function initializeState() {
  const config = await getInitialState();
  initialDate = parseISO(config.initial_date);
  console.log('Initial date: ', initialDate);
}

async function updateDate(string) {
  initialDate = new Date(string);
  await storage.updateItem('initial date', initialDate);
}

export { allWildfires, initialDate, updateDate, initializeState };
