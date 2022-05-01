# Excel Airtable Plugin

## Quick Start
- To update `Trainee` && `Managers` tables
  - Prod: `npm run prod <relative location of New Hire Excel Sheet>`
- To update `Test Trainee` && `Test Managers` tables
  - Dev With Your Data: `npm run dev <relative location of New Hire Excel Sheet>`
  - Dev With Sample Data: `npm run dev`

## Purpose:
A simple tools that:
1. Consumes the New Hire Excel sheet from T-Mobile (`loadFile()`)
2. Filters the list by title (`filterByTitle()`)
3. Finds and adds any managers that isn't already in the `Managers` table (`processNewManagers()`)
4. Compares and removes any duplicate entries based on existing Airtable data (`checkForDuplicates()`)
5. In trainee data, exchanges `manager.name` for `manager.id` (`replaceManagers()`)
6. Uploads new trainees to the `Trainees` table (`updateAirtable()`)

## How to use:
1. Download the repository
### Production
1. Run `npm run prod <relative file location>`
   - For example, if you place the Excel sheet (new_hire_data_2022.xlsx) in the root of this project, your command would be `npm start new_hire_data_2022.xlsx`.
### Development
1. Run `npm run dev`
   - If you use this command alone it will use `/sample_data/test-data.xlsx`, but you can also run `npm run dev <relative file location>` if you'd like to use your own sample data.
   - Regardless of the file it's pointed at this command will point the tool to `Test Managers` && ` Test Trainees`
