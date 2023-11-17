import storage from 'node-persist';
import { parseISO } from 'date-fns';

const allWildfires = [];
var initialDate;

initialDate = new Date('December 5, 2023 09:00:00');

async function initializeState() {
  const iD = await storage.getItem('initial date');
  console.log(parseISO(iD));
  initialDate = parseISO(iD) || initialDate;
}

async function updateDate(string) {
  initialDate = new Date(string);
  await storage.updateItem('initial date', initialDate);
}

export { allWildfires, initialDate, updateDate, initializeState };
