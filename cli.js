#!/usr/bin/env node

const env = require('dotenv').config();
const QikTrak = require('./qik-trak');

const cfg = {
    operations: 
    {
      untrack: true,
      trackTables: true,
      trackRelationships: true
    },

    logOutput: true,
    hasuraAdminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
    hasuraEndpoint: process.env.HASURA_GRAPHQL_ENDPOINT,
    targetDatabase: process.env.TARGET_DATABASE,
    targetSchema: process.env.TARGET_SCHEMA
  }

new QikTrak(cfg).ExecuteQikTrack()
