import { parseISO } from 'date-fns';

import { getInitialState, updateConfigFile } from './octokit.js';

const allWildfires = [];
var initialDate;
var lastURL;

async function initializeState() {
  const { initial_date, last_url } = await getInitialState();
  initialDate = parseISO(initial_date);
  lastURL = last_url;
  console.log('Initial date: ', initialDate);
  console.log('Last URL: ', lastURL);
}

async function updateConfig({ key, data }) {
  if (key === 'initial_date') {
    initialDate = data;
  } else if (key === 'last_url') {
    lastURL = data;
  }

  try {
    await updateConfigFile({ key, data });
  } catch (error) {
    console.log(error);
  }
}

export { allWildfires, initialDate, initializeState, lastURL, updateConfig };
