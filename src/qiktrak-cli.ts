#!/usr/bin/env node

const env = require('dotenv').config();
import QikTrak from './qiktrak';
import fs from 'fs';

// Get files of a specified type from the folder
function getFiles(folder: string, fileType: string) {
  try {
    return fs
      .readdirSync(folder)
      .filter((f) => f.toLowerCase().endsWith(fileType.toLowerCase()))
      .map((f) => {
        return folder + '/' + f;
      });
  } catch (e) {
    console.log('Failed to get files from: ' + folder);
    throw e;
  }
}

// Configure all aspects of tracker behaviour
const cfg = {
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
  dumpJsonViewSql: process.env.JSON_VIEWS_DUMP_SQL === 'true', // special hack to log generated JSON views to the console so they can be copied and pasted into other migration scripts
};

if (cfg.operations.executeSqlScripts) {
  if (process.env.BEFORE_SCRIPTS_FOLDER) cfg.scripts.beforeViews = getFiles(process.env.BEFORE_SCRIPTS_FOLDER, 'sql');
  if (process.env.AFTER_SCRIPTS_FOLDER) cfg.scripts.afterViews = getFiles(process.env.AFTER_SCRIPTS_FOLDER, 'sql');
}

if (cfg.operations.createJsonViews) {
  if (process.env.JSON_VIEWS_FOLDER) cfg.views = getFiles(process.env.JSON_VIEWS_FOLDER, 'json');
}

// Execute the Qiktrak operation
console.log("Pause to ensure database has stabilised...")

setTimeout(async () => {
  const qiktrak = new QikTrak(cfg);
  void qiktrak.ExecuteQikTrack();
}, 5000);
