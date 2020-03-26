const csv = require('csv-parser');
const fs = require('fs');


const dates_groups = {};


fs.createReadStream('time_series_covid19_confirmed_global.csv')
  .pipe(csv())
  .on('data', (rows) => {
    // console.log(rows);

    rows.forEach(row => {

      if (!dates_groups[]) {
        
      }
      
    });
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
  });