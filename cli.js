#!/usr/bin/env node


const fs = require('fs');
const path = require('path');
const env = require('dotenv').config();

const QikTrack = require('./index.js');

const HELP = `
qik-track
  
  --use_env             use environment variables

  --config              use a config file if present
                        defaults to qik-track.json

  --hasuraEndpoint      the hasura endpoint to connect to
                        only used when the config file isn't present
                        eg: http://localhost:8080/v1/query

  --hasuraAdminSecret   the hasura admin secret
                        to access hasura endpoint
                        eg: myadminsecretkey

  --targetSchema        the postgres db target schema to connect to
                        only used when the config file isn't present
                        defaults to public

  --silent              don't print logs as the tool runs
                        defaults to false

  --version             print the version
`

const settings = {
  config,
  hasuraEndpoint,
  hasuraAdminSecret,
  help,
  targetSchema,
  silent,
  version,
  use_env
} = require('minimist')(process.argv.slice(2), {
  alias: {
    help: 'h',
  },

  booleans: ['help', 'silent', 'version', 'use_env'],

  default: {
    config: 'qik-track.json',
    hasuraEndpoint: null,
    hasuraAdminSecret: null,
    help: false,
    targetSchema: 'public',
    silent: false,
    version: false,
    use_env: true
  },
})

if (use_env && process.env.HASURA_ADMIN_SECRET)
  settings.hasuraAdminSecret = process.env.HASURA_ADMIN_SECRET;

if (use_env && process.env.HASURA_ENDPOINT)
  settings.hasuraEndpoint = process.env.HASURA_ENDPOINT;

if (use_env && process.env.TARGET_SCHEMA)
  settings.targetSchema = process.env.TARGET_SCHEMA;

if (help) {
  console.log(HELP)
  process.exit()
}

if (version) {
  console.log(require('./package.json').version)

  process.exit()
}

let hatConfig = null
const configFile = path.join(process.cwd(), config);

if (!use_env && !fs.existsSync(configFile)) {
  console.log("Can't find config file : '" + configFile + "'");
}


if (fs.existsSync(configFile)) {
  hatConfig = require(configFile)
} else if (settings.hasuraEndpoint) {
  hatConfig = { ...settings,
    logOutput: !silent
  }
} else {
  console.log(HELP)
  process.exit()
}

// Copy from example/run_hat.js
if (!hatConfig.operations) {
  hatConfig.operations = {};
  hatConfig.operations.untrack = true;
  hatConfig.operations.trackTables = true;
  hatConfig.operations.trackRelationships = true;
}

console.log(`qik-track will run with the following configuration:
${JSON.stringify(hatConfig, null, '  ')}`)

new QikTrack().ExecuteQikTrack(hatConfig, !silent)
