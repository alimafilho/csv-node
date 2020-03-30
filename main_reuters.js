const fs = require('fs');
const data_reuters = require('./data.json');


const dateFormater = (date) => {
  const d = date.split('/');

  const toFixed = (dd) => {
    return dd.length === 1 ? `0${dd}` : dd
  }
  return `${d[2]}-${ toFixed(d[0]) }-${ toFixed(d[1]) }`;
}


function mock_countries () {
  const __data_reuters = data_reuters.slice();


  const __data_reuters_filter = __data_reuters.filter(row => {
    const dateInit = new Date('2020-01-22')
    const _d = new Date(dateFormater(row.date));
    return (_d.getTime() >= dateInit.getTime())
  })

  const data_reuters_compare = __data_reuters_filter.slice();

  const data_formated = __data_reuters_filter.map((datecountry, index) => {

    // {"date":"3\/25\/2020","location":"Mali","cases":"2","deaths":null,"recovered":null,"updated":"03\/25\/2020 1400"}
    const {date, location , cases, deaths, recovered, updated } = datecountry;

    const obj = {};
    obj.date = dateFormater(date);
    obj.location = location;
    obj.cases = cases;

    const dt = new Date( dateFormater(date) );
    
    // dt.setDate( dt.getDate() - 1 );


    let filterItemPerDate = null;

    for (let i=0; i<10; i++) {
      dt.setDate( dt.getDate() - 1 );
      filterItemPerDate = data_reuters_compare.filter((row, idx) => {
        const _d = new Date(dateFormater(row.date));
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
    
    // obj.name = city.nome;
    // obj.id = city.id;
    // obj.estado = city.microrregiao.mesorregiao['UF'].nome;
    // obj.uf = city.microrregiao.mesorregiao['UF'].sigla;
    // obj.couf = city.microrregiao.mesorregiao['UF'].id;
    // obj.regiao = city.microrregiao.mesorregiao['UF']['regiao'].nome;
    // obj.regiaosigla = city.microrregiao.mesorregiao['UF']['regiao'].sigla;
  
  
    return obj;
  })

  /**
   * 
   * remove data sem casos novo
   */

  const data_formated_JSON = data_formated.filter(row => parseInt(row.cases) > 0);

  const names_countries = {}

  data_formated_JSON.forEach((row) => names_countries[row.location] = row.location)

  // let data = JSON.stringify(data_formated_JSON);
  let data = JSON.stringify(names_countries);
  fs.writeFileSync('data-out.json', data);
  // console.log('ok', data);
  console.log('file ok');
}

// dados_cms_csv_nomes()
mock_countries()