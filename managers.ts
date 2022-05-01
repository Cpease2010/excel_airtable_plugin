import {Trainee} from "./index";
const Airtable = require("airtable");
const dotenv = require('dotenv').config({path: 'env/.env'});
const table = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base(process.env.AIRTABLE_BASE_ID || '');
const tableName = process.env.NODE_ENV == 'dev' ? 'Test Managers' : 'Managers'

class Manager {
  name: String
  id?: String
  email?: String
}

const getManagerList = async () => {
  let airtableManagerList: Manager[] = []

  await table(tableName).select({
    view: 'All'
  }).eachPage(function (records, fetchNextPage) {
    records.forEach(function (record) {
      airtableManagerList.push({
        name: record.get('Name'),
        id: record.getId()
      })
    }), fetchNextPage();
  })
  .catch(reason => console.error({ location: 'getMangerList()', error: reason.message }))
  .finally(() => console.log('getMangerList() Complete'))


  return airtableManagerList;
}

const filterManagers = (airtableManagerList: Manager[], excelManagerList: Manager[]) => {
  let newManagers: Manager[] = [];
  excelManagerList.forEach(manager => {
    if (airtableManagerList.find(value => value.name == manager.name)) {
      return true;
    } else {
      newManagers.push(manager)
      airtableManagerList.push({
        name: manager.name,
      })
    }
  })
  return newManagers
}

const replaceManagers = async (trainees: Trainee[]) =>
  await getManagerList()
  .then((airtableManagerList) => {
    trainees.forEach( ({fields}) => {
        let atFind = airtableManagerList.find(({name}) => name == fields.Manager[0])
        atFind ? fields.Manager[0] = atFind.id : delete fields.Manager
    })
    return trainees
  })


const addManagers = (newManagers: Manager[]) => {
  console.log(`There were ${newManagers.length} new managers added!`)
  newManagers.forEach(manager =>
    table(tableName).create([{
      fields: {
        Name: manager.name,
        Email: manager.email
      }
    }])
    .catch(reason => console.error({ location: 'addManager()', error: reason.message }))
  );
  console.log('addMangers() Complete')
}

const processNewManagers = (excelList: Manager[]) =>
  getManagerList()
    .then((airtableList: Manager[]) => addManagers(filterManagers(airtableList, excelList)))
    .catch(reason => console.error({ location: 'processNewManager()', error: reason.message}))
    .finally(() => console.log('processNewMangers() Complete'))

export {processNewManagers, replaceManagers, Manager};
