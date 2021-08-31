#!/usr/bin/env node

const fs = require('fs');
const env = require('dotenv').config();
const QikTrak = require('./qik-trak');

function getFiles(folder, fileType) {
  try {
    return fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith(fileType.toLowerCase())).map(f => { return folder +"/" + f });
  }
  catch(e) {
    console.log("Failed to get files from: " + folder);
    throw e;
  }
}

const cfg = {
    operations: 
    {
      untrack: true,
      trackTables: true,
      trackRelationships: true,
      createJsonViews: true,
      executeSqlScripts: true
    },
    
    scripts: {
      beforeViews:[],
      afterViews:[]
    },

    logOutput: true,
    hasuraAdminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
    hasuraEndpoint: process.env.HASURA_GRAPHQL_ENDPOINT,
    targetDatabase: process.env.TARGET_DATABASE,
    targetSchema: process.env.TARGET_SCHEMA
  }

  if(cfg.operations.executeSqlScripts) {
    if (process.env.BEFORE_SCRIPTS_FOLDER)
      cfg.scripts.beforeViews = getFiles(process.env.BEFORE_SCRIPTS_FOLDER, "sql");
    
    if (process.env.AFTER_SCRIPTS_FOLDER)
      cfg.scripts.afterViews = getFiles(process.env.AFTER_SCRIPTS_FOLDER, "sql");
  }

new QikTrak(cfg).ExecuteQikTrack()
