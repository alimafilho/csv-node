const csv = require('csv-parser');
const fs = require('fs');


const namecountries = require('./name_countries_JH_EN_PT-BR.json');


// const fetch = require('node-fetch');

// fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
//   // .then(response => response.json())
//   .then(response => response.buffer())
//   .then(data => {
//     console.log(data);
//     fs.writeFileSync('git-row.csv', data);
//   })
//   .catch(err => console.log(err))

  

//   return console.log('fim')


const dates_groups = {};
const dates_groups_deaths = {};

const cities_group = {};
const cities_group_deaths = {};


const isDateValid = (date) => {
  const datesplit = date.split('/');

  const toFixed = (dd, format = 'day') => {
    if (format === 'day') {
      return dd.length === 1 ? `0${dd}` : dd
    } else if (format === 'year') {
      return dd.length === 2 ? `20${dd}` : dd
    }
  }

  if (datesplit.length === 3) {
    const year = datesplit[2];
    const month = datesplit[0];
    const day = datesplit[1];
    const d = new Date(toFixed(year, 'year'), (parseInt(month)-1), day); // o mês começa a contar em 0-11
    // console.log(d.toString()); // shows 'Invalid Date'
    // console.log(typeof d); // shows 'object'
    // console.log(d instanceof Date); // shows 'true'

    if (d instanceof Date) {
      return `${d.getFullYear()}-${toFixed(month)}-${toFixed(day)}`
    } else {
      return null;
    }
  } else {
    return null;
  }
}



fs.createReadStream('time_series_covid19_confirmed_global.csv')
  .pipe(csv())
  .on('data', (row) => {
    // console.log('x', row);

    //
    const keys = Object.keys(row)
    for (const key of keys) {
      // console.log(key, keys)
      const date = isDateValid(key);
      if (date) {
        if (!dates_groups[date]) dates_groups[date] = {};

        if (dates_groups[date][row['Country/Region']]) {
          dates_groups[date][row['Country/Region']] = (dates_groups[date][row['Country/Region']] + parseInt(row[key]));
        } else {
          dates_groups[date][row['Country/Region']] = parseInt(row[key]);
        }
      }
    }
  })
  .on('end', () => {
    console.log('CSV file successfully processed');
    // console.log(cities_group)
    // console.log(dates_groups)

    const dataJSON = [];

    for(let key in dates_groups) {
      const date = key;
      const dates = dates_groups[key];

      for(let key in dates) {
        const country = key;
        const cases = dates[key];

        const rowItem = {};
        rowItem.date = date;
        rowItem.location = country;
        rowItem.cases = cases;

        dataJSON.push(rowItem)
      }
    };

    // remove cases === 0
    const dataJSON_filter = dataJSON.filter(row => row.cases > 0);

    // gera dos casos unicos por dia
    const data_reuters_compare = dataJSON_filter.slice();

    const data_formated = data_reuters_compare.map((datecountry, index) => {
      // {"date":"3\/25\/2020","location":"Mali","cases":"2","deaths":null,"recovered":null,"updated":"03\/25\/2020 1400"}
      const {date, location , cases } = datecountry;
      const obj = {};
      obj.date = date;
      obj.location = location;
      obj.cases = cases;

      const dt = new Date( date );
      let filterItemPerDate = null;

      for (let i=0; i<10; i++) {
        dt.setDate( dt.getDate() - 1 );
        filterItemPerDate = data_reuters_compare.filter((row, idx) => {
          const _d = new Date(row.date);
          return ((_d.getTime() === dt.getTime()) && row.location === location)
        });

        if (filterItemPerDate[0]) {
          break;
        }
      }
      
      if (filterItemPerDate[0]) {
        // obj.cases_uniq = cases - filterItemPerDate[0].cases;
        obj.cases = parseInt(cases - filterItemPerDate[0].cases);
      } else {
        // obj.cases_uniq = cases
        obj.cases = parseInt(cases)
      }

      if (obj.cases < 0) {
        console.log('err -1', obj);
      }
  
      return obj;
    })


    let totalcases = 0;
    const listNameCountries = []
    const data_formated_JSON = data_formated.filter(row => {
      if (!listNameCountries.includes(row.location)) listNameCountries.push(row.location);
      if (parseInt(row.cases) > 0) totalcases = totalcases + parseInt(row.cases);
      return parseInt(row.cases) > 0
    });

    console.log('totalcases', totalcases)
    return generateFile(data_formated_JSON)
    /**
     * gerar aquivo
     */

    // let data = JSON.stringify(dataJSON_filter);
    let data = JSON.stringify(data_formated_JSON);
    // fs.writeFileSync('data-JH.json', data);
    fs.writeFileSync('data-JH_cases-uniq.json', data);

    fs.writeFileSync('list_name_contries.txt', listNameCountries);

    
  });

/**
 * adiciona as mortes
 */
function generateFile(data) {
  const datacountries = data;
  fs.createReadStream('time_series_covid19_deaths_global.csv')
  .pipe(csv())
  .on('data', (row) => {
    const keys = Object.keys(row)
    for (const key of keys) {
      // console.log(key, keys)
      const date = isDateValid(key);
      if (date) {
        if (!dates_groups_deaths[date]) dates_groups_deaths[date] = {};

        if (dates_groups_deaths[date][row['Country/Region']]) {
          dates_groups_deaths[date][row['Country/Region']] = (dates_groups_deaths[date][row['Country/Region']] + parseInt(row[key]));
        } else {
          dates_groups_deaths[date][row['Country/Region']] = parseInt(row[key]);
        }
      }
    }

  }).on('end', async () => {

    const dataJSON = [];

    for(let key in dates_groups_deaths) {
      const date = key;
      const dates = dates_groups_deaths[key];

      for(let key in dates) {
        const country = key;
        const deaths = dates[key];

        const rowItem = {};
        rowItem.date = date;
        rowItem.location = country;
        rowItem.deaths = deaths;

        dataJSON.push(rowItem)
      }
    };

    // remove deaths === 0
    const dataJSON_filter = dataJSON.filter(row => row.deaths > 0);

    // gera dos casos unicos por dia
    const data_reuters_compare = dataJSON_filter.slice();


    let totaldeaths = 0;
    const data_formated = data_reuters_compare.map((datecountry, index) => {
      // {"date":"3\/25\/2020","location":"Mali","deaths":"2","deaths":null,"recovered":null,"updated":"03\/25\/2020 1400"}
      const {date, location , deaths } = datecountry;
      const obj = {};
      obj.date = date;
      obj.location = location;
      obj.deaths = deaths;

      const dt = new Date( date );
      let filterItemPerDate = null;

      for (let i=0; i<10; i++) {
        dt.setDate( dt.getDate() - 1 );
        filterItemPerDate = data_reuters_compare.filter((row, idx) => {
          const _d = new Date(row.date);
          return ((_d.getTime() === dt.getTime()) && row.location === location)
        });

        if (filterItemPerDate[0]) {
          break;
        }
      }
      
      if (filterItemPerDate[0]) {
        // obj.deaths_uniq = deaths - filterItemPerDate[0].deaths;
        obj.deaths = parseInt(deaths - filterItemPerDate[0].deaths);
      } else {
        // obj.deaths_uniq = deaths
        obj.deaths = parseInt(deaths)
      }

      if (obj.deaths < 0) {
        console.log('err -1', obj);
      }

      if(obj.deaths > 0) totaldeaths = totaldeaths + parseInt(obj.deaths)
  
      return obj;
    })

    // console.log(data_formated);

    let deaths_datafile = JSON.stringify(data_formated);
    // fs.writeFileSync('data-JH.json', data);
    fs.writeFileSync('_deaths.json', deaths_datafile);

    
    const ddd = []
    const data_add_deaths = [];
    
    data.forEach(row => {
      // console.log(' row', row)
      const { date, location} = row;
      const isDeaths = data_formated.filter(r => {
        const dcases = date;
        const ddeaths = r.date;
        // const dcases = new Date(date);
        // const ddeaths = new Date(r.date);


        // console.log(ddeaths ,dcases, r.location, location,r.deaths , 0)
        return (ddeaths.toString() === dcases.toString()) && (r.location.trim() === location.trim()) && (r.deaths > 0)
      });

      if (isDeaths.length > 1 && location === 'Italy') {
        console.log('if',  date, location, isDeaths )
      }

      if (date === "2020-03-21" && location === 'Italy') {
        console.log( '...', date, location, isDeaths )
      }
      const obj = row;
      obj.deaths = (isDeaths[0]) ? isDeaths[0].deaths : 0;
      data_add_deaths.push(obj)
    });


    /**
     * traduzir os nomes
     */

    // namecountries

    const data_add_deaths_translate = data_add_deaths.map(row => {

      const obj = row;

      const name_en = namecountries.filter(item => item.JH.toLowerCase() === row.location.toLowerCase());

      if (name_en[0]) {
        obj.location = name_en[0].NAME_EN
      }
      return obj
    })

    const dateNow = new Date();
    const fileJSON = {}
    fileJSON.docs = data_add_deaths_translate;
    fileJSON.updated_at =  `${dateNow.getDate()}/${dateNow.getMonth()+1}/${dateNow.getFullYear()}`

    let datafile = JSON.stringify(fileJSON);
    // fs.writeFileSync('data-JH.json', data);
    fs.writeFileSync('data-JH_cases-deaths.json', datafile);

    console.log('totaldeaths', totaldeaths)

    /**
     * nomes dos países e pt-BR
     */

    const names = {}
    namecountries.forEach(item => {
      names[item.JH] = item.NAME_PT_BR
    })


    let datafilenames = JSON.stringify(names);
    // fs.writeFileSync('data-JH.json', data);
    fs.writeFileSync('name_jh_PT_BR.json', datafilenames);

    // conta o total de casos e morte no mundo
    const countriesTotals = {};

    data_add_deaths_translate.forEach(item => {

      if (countriesTotals[item.location]) {
        countriesTotals[item.location].cases = countriesTotals[item.location].cases + item.cases;
        countriesTotals[item.location].deaths = countriesTotals[item.location].deaths + item.deaths;
      } else {
        countriesTotals[item.location] = {};
        countriesTotals[item.location].cases =  item.cases;
        countriesTotals[item.location].deaths =  item.deaths;
      }
    })

    let datafileTotalsCount = JSON.stringify(countriesTotals);
    // fs.writeFileSync('data-JH.json', data);
    fs.writeFileSync('total_cases_deaths.json', datafileTotalsCount);

  });
}