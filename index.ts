import {processNewManagers, Manager, replaceManagers} from "./managers";
const Airtable = require("airtable");
const ExcelJS = require('exceljs');
const dotenv = require('dotenv').config({path: 'env/.env'});
const table = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID || '');
const tableName = process.env.NODE_ENV == 'dev' ? 'Test Trainees' : 'Trainees'

export class Trainee {
  fields: TraineeFields
}

class TraineeFields {
  Name: String
  'Employee ID': String
  Title: String
  Type: String
  'Start Date': String
  Manager?: String[]
}

const filterByTitle = (title) => {
  let eligibleTitles = /engineer, software|developer, software/i
  let ineligibleLevel = /principal/i
  return eligibleTitles.test(title) && !ineligibleLevel.test(title)
}

const loadFile = async (file = process.argv[2] || "sample_data/test-data.xlsx", sheet = "Sheet1") => {
  if (!process.argv[2]) console.log("Worksheet full of sample data!!");
  let potentialTrainees: Trainee[] = [];
  let excelManagerList: Manager[] = [];
  const worksheet = new ExcelJS.Workbook().xlsx.readFile(file).then((worksheet) => worksheet.getWorksheet(sheet));

  await worksheet
  .then((wksht) =>
    wksht.getRows(3, wksht.actualRowCount - 2)
      .forEach((row) => {
        if (filterByTitle(row.getCell('E').value.result)) {
          excelManagerList.push({
            name: row.getCell('I').value.result,
            email: row.getCell('J').value.result
          })
          potentialTrainees.push({
            fields: {
              "Name": row.getCell('A').value.result + " " + row.getCell('B').value.result,
              "Employee ID": 'P' + row.getCell('D').value.result,
              "Title": row.getCell('E').value.result,
              "Type": row.getCell('F').value.result,
              "Start Date": new Date(row.getCell('Q').value.result).toLocaleDateString(),
              "Manager": [row.getCell('I').value.result]
            }
          })
        }
      }
    )
  )
  .catch(reason => console.error({ location: 'loadFile()', error: reason.message}))
  .finally( () => console.log('loadFile() Complete'))
  return {potentialTrainees: potentialTrainees, excelManagerList: excelManagerList}
}

const loadAirTable = async () => {
  let currentTrainees: String[] = [];

  await table(tableName)
  .select({fields: ['Employee ID']})
  .eachPage((records, fetchNextPage) => {
    records.forEach((record) => {
      currentTrainees.push(record.get("Employee ID"))
    }), fetchNextPage()
  })
  .catch(reason => console.error({ location: 'loadAirtable()', error: reason.message}))
  .finally( () => console.log('loadAirTable() Complete'))
  return currentTrainees
}

const checkForDuplicateTrainees = (potentialTrainees: Trainee[], currentTrainees: String[]) => {
  let duplicateTrainees: Trainee[] = []
  let nonDuplicateTrainees: Trainee[] = []
  potentialTrainees.forEach(({fields}, index) => {
    if (currentTrainees.find(value => value == fields['Employee ID'])) {
      duplicateTrainees.push({fields})
    } else {
      nonDuplicateTrainees.push({fields})
    }
  })
  return nonDuplicateTrainees
}

const updateAirtable = (trainees: Trainee[]) => {
  console.log(`There were ${trainees.length} new trainees added!`)
  while (trainees.length > 10) {
    table(tableName)
    .create(trainees.splice(0, 9))
    .catch((reason) => console.error({ location: 'updateAirtable()', error: reason.message }))
    .finally(() => console.log('updateAirTable() Complete'))
  }
  return table(tableName)
  .create(trainees)
  .catch((reason) => console.error({ location: 'updateAirtable()', error: reason.message}))
  .finally(() => console.log('updateAirTable() Complete'))
}

loadFile()
  .then(({potentialTrainees, excelManagerList}) =>
    processNewManagers(excelManagerList)
      .then(() =>
        loadAirTable()
          .then((currentTrainees) => checkForDuplicateTrainees(potentialTrainees, currentTrainees))
          .then((nonDuplicateTrainees) => replaceManagers(nonDuplicateTrainees))
          .then((nonDuplicateTrainees) => updateAirtable(nonDuplicateTrainees)))
  .catch(reason => console.error({ location: 'loadFile()', error: reason.message }))
  .finally( () => console.log('loadFile() Complete')))
