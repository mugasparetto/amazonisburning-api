const allWildfires = [];
var initialDate;

initialDate = new Date('December 5, 2023 09:00:00');

function updateDate(string) {
  initialDate = new Date(string);
}

export { allWildfires, initialDate, updateDate };
