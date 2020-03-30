const csv = require('csv-parser');
const fs = require('fs');

const files = [
  '01-22-2020', '01-23-2020', '01-24-2020', '01-25-2020', '01-26-2020', '01-27-2020', '01-28-2020','01-29-2020','01-30-2020','01-30-2020',
  '02-01-2020','02-02-2020','02-03-2020','02-04-2020','02-05-2020','02-06-2020','02-07-2020','02-08-2020','02-09-2020','02-10-2020','02-11-2020','02-12-2020','02-13-2020','02-14-2020','02-15-2020','02-16-2020','02-17-2020','02-18-2020','02-19-2020','02-20-2020','02-21-2020','02-22-2020','02-23-2020','02-24-2020','02-25-2020','02-26-2020','02-27-2020','02-28-2020','02-29-2020',
  '03-01-2020','03-02-2020','03-03-2020','03-04-2020','03-05-2020','03-06-2020','03-07-2020','03-08-2020','03-09-2020','03-10-2020','03-11-2020','03-12-2020','03-13-2020','03-14-2020','03-15-2020','03-16-2020','03-17-2020','03-18-2020','03-19-2020','03-20-2020','03-21-2020','03-22-2020','03-23-2020','03-24-2020','03-25-2020','03-26-2020','03-27-2020',
]

const datafile = [];

const dates_groups = {}

const dateFormated = (date) => {
  const d = date.split('-');
  return `${d[2]}-${d[0]}-${d[1]}`
}

files.forEach((date, index) => {
  fs.createReadStream(`data/${date}.csv`)
  .pipe(csv())
  .on('data', (row) => {
    const dateitem = dateFormated(date);
    const cases = row['Confirmed'] ? parseInt(row['Confirmed']) : 0;
    const deaths = row['Deaths'] ? parseInt(row['Deaths']) : 0;

    const country = row['Country_Region'] ? row['Country_Region']  : row['Country/Region'];
    const item = {};
    // item.location = row['Country_Region'];
    item.cases = cases;
    item.deaths = deaths;
    // item.date = dateitem;
    // datafile.push(item)

    // console.log(country)
    // não tem a data
    if (!dates_groups[dateitem]) dates_groups[dateitem] = {};

    // não tem o país
    if (!dates_groups[dateitem][country]) {
      dates_groups[dateitem][country] = item
    } else {
      dates_groups[dateitem][country].cases = dates_groups[dateitem][country].cases + parseInt(cases);
      dates_groups[dateitem][country].deaths = dates_groups[dateitem][country].deaths + parseInt(deaths);
    }
  })
  .on('end', () => {
    console.log('date', date);

    if (index === (files.length -1)) {
      let datafilenames = JSON.stringify(dates_groups);
      // fs.writeFileSync('data-JH.json', data);
      fs.writeFileSync('new.json', datafilenames);
    }
  })
})

