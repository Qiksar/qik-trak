#!/usr/bin/env node

const env = require('dotenv').config();
import QikTrak from './qiktrak';
import fs from 'fs';

// Get files of a specified type from the folder
function getFilenames(folder: string, fileType: string) {
  try {
    return fs
      .readdirSync(folder)
      .filter((f) => f.toLowerCase().endsWith(fileType.toLowerCase()))
      .map((f) => {
        return folder + '/' + f;
      });
  } catch (e) {
    console.log('Failed to get file names from: ' + folder);
    throw e;
  }
}

// Configure all aspects of tracker behaviour
const defaultConfig = {
  keyColumnSuffix: '_id', // ID columns on tables will have this suffix, therefore the name of a tracked column can be specified by removing this suffix from the column. e.g. 'leader_id' becomes 'leader'

  operations: {
    untrack: true, // remove all existing tracking metadata
    trackTables: true, // track all tables
    trackRelationships: true, // track all relationhips
    createJsonViews: true, // create views to conveniently surface JSON data as columns
    executeSqlScripts: true, // execute SQL scripts
  },

  scripts: {
    beforeViews: [] as string[], // list of scripts to run before JSON views are created
    afterViews: [] as string[], // list of scripts to run after JSON views have been created
  },

  views: [] as string[], // list of JSON views

  logOutput: true, // Log output to the console
  hasuraAdminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET, // admin secret is required to provide all of the intrinsic operations
  hasuraEndpoint: process.env.HASURA_GRAPHQL_ENDPOINT, // path to the HASURA endpoint
  targetDatabase: process.env.TARGET_DATABASE, // name of target database
  targetSchema: process.env.TARGET_SCHEMA, // name of target schema
  dumpJsonViewSql: process.env.JSON_VIEWS_DUMP_SQL === 'false', // special hack to log generated JSON views to the console so they can be copied and pasted into other migration scripts
};

// Execute the Qiktrak operation
console.log('Pause 5 seconds to ensure database has stabilised...');

setTimeout(async () => {
  if (defaultConfig.operations.executeSqlScripts) {
    if (process.env.BEFORE_SCRIPTS_FOLDER) {
      defaultConfig.scripts.beforeViews = getFilenames(process.env.BEFORE_SCRIPTS_FOLDER, 'sql');
    }

    if (process.env.AFTER_SCRIPTS_FOLDER) {
      defaultConfig.scripts.afterViews = getFilenames(process.env.AFTER_SCRIPTS_FOLDER, 'sql');
    }
  }

  if (defaultConfig.operations.createJsonViews) {
    if (process.env.JSON_VIEWS_FOLDER) defaultConfig.views = getFilenames(process.env.JSON_VIEWS_FOLDER, 'json');
  }

  const qiktrak = new QikTrak(defaultConfig);
  void qiktrak.ExecuteQikTrack();

}, 5000);
