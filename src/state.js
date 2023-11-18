import storage from 'node-persist';
import { parseISO } from 'date-fns';

import { getInitialState, updateInitialDate } from './octokit.js';

const allWildfires = [];
var initialDate;
var lastURL;

async function initializeState() {
  const { initial_date, last_url } = await getInitialState();
  initialDate = parseISO(initial_date);
  lastURL = last_url;
  console.log('Initial date: ', initialDate);
}

async function updateDate(string) {
  initialDate = new Date(string);
  try {
    await updateInitialDate(initialDate);
  } catch (error) {
    console.log(error);
  }
}

export { allWildfires, initialDate, updateDate, initializeState, lastURL };
