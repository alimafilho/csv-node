const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fetch = require('node-fetch');

/**
 * @vars globals
 */
const namecountries = require('./name_countries_JH_EN_PT-BR.json');

async function main () {
  try {
    const dateNow = new Date();
    const baseFolderPath = `data_github/csse_covid_19_time_series/${dateNow.getFullYear()}-${dateNow.getMonth()+1}-${dateNow.getDate()}/`;

    const basePathConfirmed = `${baseFolderPath}/time_series_covid19_confirmed_global.csv`;
    const basePathDeaths = `${baseFolderPath}/time_series_covid19_deaths_global.csv`;

    if (!fs.existsSync(baseFolderPath)) {
      fs.mkdirSync(baseFolderPath)
    }

    const confirmed = await fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv');
    const confirmedBuffer = await confirmed.buffer();
    fs.writeFileSync(basePathConfirmed, confirmedBuffer);

    const deaths = await fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv');
    const deathsBuffer = await deaths.buffer();
    fs.writeFileSync(basePathDeaths, deathsBuffer);

    console.log('Arquivos lidos com sucesso do Github');
    generateFiles(basePathConfirmed, basePathDeaths);
  
  } catch (err) {
    console.log(err)
  }
}

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
    const [ month, day, year ] = datesplit; /** @date: 3/29/20 => m/d/yy */
    const d = new Date(toFixed(year, 'year'), (parseInt(month)-1), day); // o mês começa a contar em 0-11
    return  (d instanceof Date) ? `${d.getFullYear()}-${toFixed(month)}-${toFixed(day)}` : null
  } else {
    return null;
  }
}

function addRowItemContent (row, namefield, arraytarget) {
  let coutryname = row['Country/Region'];
  let countcurrent = 0; // inicia em 0 e recebe o valor da próxima data

  /**
   * faz a tradução dos nomes para EN
   */
  const name_en = namecountries.filter(item => item.JH.toLowerCase() === coutryname.toLowerCase());
  if (name_en[0]) {
    coutryname = name_en[0].NAME_EN;
  }

  /**
   * faz um loop por todos os itens da linha do csv
   */
  const keys = Object.keys(row)
  for (const key of keys) {
    // console.log(key, keys)
    const date = isDateValid(key);
    if (date) {
      const valueRow = parseInt(row[key]);
      const itemContent = {};

      const valuecurent = valueRow - countcurrent;
      itemContent.date = date;
      itemContent.location = coutryname;
      itemContent[namefield] = valuecurent;

      countcurrent = valueRow;

      /**
       * loop: verificação se a data e o país já foram incluidos no array
       */
      let isItemExist = false;
      let indexArray = -1;

      for(let i=0; i < arraytarget.length; i++) {
        if (
          arraytarget[i].date === date
          && arraytarget[i].location === coutryname
        ) {
          isItemExist = true;
          indexArray = i;
          break;
        }
      }

      /**
       * if:  verificação se foi encontrada a data e o país no array
       */
      if (isItemExist) {
        const indexItem = arraytarget[indexArray];
        indexItem[namefield] = indexItem[namefield] + valuecurent;
        arraytarget[indexArray] = indexItem;
      } else {
        arraytarget.push(itemContent)
      }
    }
  }
}

function generateFiles(basePathConfirmed, basePathDeaths) {
  const content = [];
  const contentDeaths = [];

  /**
   * leitura dos aquivos CSV
   * 1º lê o csv de mortes
   * 2º lê o csv de casos
   */

  fs.createReadStream(basePathDeaths)
    .pipe(csv())
    .on('data', (row) => {
      /**
       * geração do calculo das mortes
       */
      addRowItemContent(row, 'deaths', contentDeaths);
    })
    .on('end', () => {
      /**
       * geração do calculo dos casos
       */
      fs.createReadStream(basePathConfirmed)
        .pipe(csv())
        .on('data', (row) => {
          addRowItemContent(row, 'cases', content);
        })
        .on('end', () => {  
          /**
           * calcula o valor total dos casos e mortes
           */
          let total = 0;
          let totaldeaths = 0;
      
          content.forEach(row => total = total + row.cases)
          contentDeaths.forEach(row => totaldeaths = totaldeaths + row.deaths)
  
          /**
           * faz o join entre os dados de casos o confirmados e mortes
           */
          const rowsContentFile = [];
          const contentTotalItems = content.length;
          content.forEach((row, indx)=> {
            const { date, location } = row;
            const dateCases = new Date(date);
  
            /**
             * verifica se location existe
             */
            if (!location) console.log(location, row)
  
            /**
             * @filter
             */
            const isDateDeaths = contentDeaths.filter((item, index) => {
              const dateDeaths = new Date(item.date);
              const locationDeaths = item.location;
  
              return dateCases.getTime() === dateDeaths.getTime() && location.trim().toLowerCase() === locationDeaths.trim().toLowerCase()
            });
  
            const itemfile = row;
            if (isDateDeaths[0]) {
              if (isDateDeaths.length > 1) console.log('error filter', isDateDeaths);
              itemfile.deaths = isDateDeaths[0].deaths;
            } else {
              itemfile.deaths = 0;
            }
            console.log(`${location} ${indx}/${(contentTotalItems-1)}`)
            rowsContentFile.push(itemfile)
          });
  
          /**
           * @filter: remove linhas com casos e mortes === 0
           */
           const fileoutfilter = rowsContentFile.filter(row => row.cases > 0 || row.deaths > 0)
  
          /**
          * cria o arquivo de saida
          */
          const dateNow = new Date();
          const fileJSON = {}
          fileJSON.docs = fileoutfilter;
          fileJSON.updated_at =  `${dateNow.getDate()}/${dateNow.getMonth()+1}/${dateNow.getFullYear()}`
  
          const fileout = JSON.stringify(fileJSON);
          const basePathFile = `out/${dateNow.getFullYear()}-${dateNow.getMonth()+1}-${dateNow.getDate()}`;
          const filenamepath = `${basePathFile}/world-cases.json`;
          if (!fs.existsSync(basePathFile)) {
            fs.mkdirSync(basePathFile)
          }

          fs.writeFileSync(filenamepath, fileout);

          /**
           * validando alguns países
           * { Brazil, China, Italy, United States, Spain, Germany, France}
           */
          const coutriesVaalidate = {}
          coutriesVaalidate['brazil'] = {c: 0, d: 0};
          coutriesVaalidate['china'] = {c: 0, d: 0};
          coutriesVaalidate['italy'] = {c: 0, d: 0};
          coutriesVaalidate['united states'] = {c: 0, d: 0};
          coutriesVaalidate['spain'] = {c: 0, d: 0};
          coutriesVaalidate['germany'] = {c: 0, d: 0};
          coutriesVaalidate['france'] = {c: 0, d: 0};

          fileoutfilter.forEach(row => {
            if (row.location.toLowerCase() === 'brazil') {
              coutriesVaalidate['brazil'].c += row.cases;
              coutriesVaalidate['brazil'].d += row.deaths;
            } else if (row.location.toLowerCase() === 'china') {
              coutriesVaalidate['china'].c += row.cases;
              coutriesVaalidate['china'].d += row.deaths;
            } else if (row.location.toLowerCase() === 'italy') {
              coutriesVaalidate['italy'].c += row.cases;
              coutriesVaalidate['italy'].d += row.deaths;
            } else if (row.location.toLowerCase() === 'united states') {
              coutriesVaalidate['united states'].c += row.cases;
              coutriesVaalidate['united states'].d += row.deaths;
            } else if (row.location.toLowerCase() === 'spain') {
              coutriesVaalidate['spain'].c += row.cases;
              coutriesVaalidate['spain'].d += row.deaths;
            } else if (row.location.toLowerCase() === 'germany') {
              coutriesVaalidate['germany'].c += row.cases;
              coutriesVaalidate['germany'].d += row.deaths;
            } else if (row.location.toLowerCase() === 'france') {
              coutriesVaalidate['france'].c += row.cases;
              coutriesVaalidate['france'].d += row.deaths;
            }
          })
  
          /**
           * saidas em console
           */
          // console.log(content)
          // console.log(fileoutfilter)
          console.log('total de casos:', total, 'mortes:', totaldeaths)
          console.table(coutriesVaalidate)
          console.log('\x1b[36m%s\x1b[0m', `Local do arquivo: ${path.join(__dirname, filenamepath)}`);
        })   
    });
}

/**
 * 
 * função principal
 */
main();

// 11759 more items