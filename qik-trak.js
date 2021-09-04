const QikTrakLogger = require("./qik-trak-logger");
const QikTrakHasura = require("./qik-trak-hasura");

//
// The purpose of this code is to allow the caller to track all Postgres tables, views and relationships with a single call
// which goes to support continuous integration as you no longer have to use the Hasura UI to click the buttons to track all tables/relationships.
//
// The code also creates SQL views which can translate JSON values into SQL data columns
//


class QikTrack {

    constructor(cfg){
        this.config =  {
            ...cfg,
            JsonViews:[]
        };
        
        if (!this.config.primaryKeySuffix) {
                this.config.primaryKeySuffix = "_id";
        }

        this.Logger = new QikTrakLogger(this.config);
        this.Hasura = new QikTrakHasura(this.config);
        this.config.Logger = this.Logger;

        // --------------------------------------------------------------------------------------------------------------------------
        // SQL to acquire metadata

        this.config.table_sql =
`
 SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.config.targetSchema}'
 UNION
 SELECT table_name FROM information_schema.views WHERE table_schema = '${this.config.targetSchema}'
 ORDER BY table_name;
 `;

        this.config.foreignKey_sql =
`
 SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name 
 FROM information_schema.table_constraints AS tc 
 JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name AND kcu.constraint_schema = '${this.config.targetSchema}'
 JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = '${this.config.targetSchema}'
 WHERE constraint_type = 'FOREIGN KEY' 
 AND tc.table_schema = '${this.config.targetSchema}'
 ;`;
    }

    //---------------------------------------------------------------------------------------------------------------------------
    // Entry point
    async ExecuteQikTrack() {

        this.Logger.Log("--------------------------------------------------------------");
        this.Logger.Log("");
        this.Logger.Log("qik-track          : Rapid, intuitive Hasura tracking setup");
        this.Logger.Log("");
        this.Logger.Log("DATABASE           : '" + this.config.targetDatabase + "'");
        this.Logger.Log("SCHEMA             : '" + this.config.targetSchema + "'");
        this.Logger.Log("");
        this.Logger.Log("HASURA ENDPOINT    : '" + this.config.hasuraEndpoint + "'");
        this.Logger.Log("PRIMARY KEY SUFFIX : '" + this.config.primaryKeySuffix + "'");
        this.Logger.Log("");
        this.Logger.Log("--------------------------------------------------------------");
        this.Logger.Log("");
        this.Logger.Log("Initial 10 second wait whilst database stabilises...");
        this.Logger.Log("");

        // When running in a container we wait 10 seconds so the database container can finish starting, initialising and be stable
        const timeout = 10000; // milliseconds

        setTimeout(async () => {
          await this.RunUntrack();
        }, timeout);

        setTimeout(async () => {
            await this.RunPreScripts();
            await this.RunViews();
            await this.RunPostScripts();
        }, timeout+2000);

        setTimeout(async () => {
            await this.RunTrackTables();
        }, timeout+5000);

        setTimeout(async () => {
            await this.RunTrackRelationships();
        }, timeout+10000);
    }

    async RunUntrack(){
        if (!this.config.operations.untrack)
            return;

        await this.Hasura.runSQL_Query(this.config.table_sql)
            .then(async (results) => {

                var tables = results
                    .map(t => t[0])
                    .splice(1);

                // --------------------------------------------------------------------------------------------------------------------------
                // Drop tracking information for all tables / views, this will also untrack any relationships
                await this.untrackTables(tables);
            });

            this.Logger.Log("");
    }

    async RunPreScripts() {
        if (!this.config.operations.executeSqlScripts) 
            return;

        this.Logger.Log("EXECUTE SQL SCRIPTS BEFORE VIEW BUILDER");
        await this.executeScriptsBeforeViewBuilder();
        this.Logger.Log("");
    }

    async RunViews() {
        if (!this.config.operations.createJsonViews)
            return;

        this.Logger.Log("GENERATE JSON VIEWS");
        await this.createJsonViews();
        this.Logger.Log("");
    }

    async RunPostScripts(){
        if (!this.config.operations.executeSqlScripts) 
            return;
    
        this.Logger.Log("EXECUTE SQL SCRIPTS AFTER VIEW BUILDER");
        await this.executeScriptsAfterViewBuilder();
        this.Logger.Log("");
    }

    async RunTrackTables(){
        if (!this.config.operations.trackTables)
            return;

        await this.Hasura.runSQL_Query(this.config.table_sql)
            .then(async (results) => {

                var tables = results
                    .map(t => t[0])
                    .splice(1);

                // --------------------------------------------------------------------------------------------------------------------------
                // Configure HASURA to track all TABLES and VIEWS - tables and views are added to the GraphQL schema automatically
                await this.trackTables(tables);
            });
    }

    async RunTrackRelationships(){
        
        if (!this.config.operations.trackRelationships)
            return;
    
        // Create the list of relationships required by foreign keys
        await this.Hasura.runSQL_Query(this.config.foreignKey_sql)
            .then(async (results) => {

                var relationships = results.splice(1)
                    .map(fk => {
                        return {
                            referencing_table: fk[0],
                            referencing_key: fk[1],
                            referenced_table: fk[2],
                            referenced_key: fk[3]
                        };
                    });
                
                // Add relationships from the Json views
                this.config.JsonViews.map((r) => {relationships.push(r)});

                // --------------------------------------------------------------------------------------------------------------------------
                // Configure HASURA to track all FOREIGN KEY RELATIONSHIPS - enables GraphQL to fetch related (nested) entities
                
                relationships.map(async (r) => {await this.Hasura.createRelationships(r)});
                this.Logger.Log("");
            });
    }

    //#region Table Tracking

    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all tables and views in the specified schema 
    async untrackTables(tables) {
        this.Logger.Log("REMOVE PREVIOUS HASURA TRACKING DETAILS FOR TABLES AND VIEWS");

        tables.map(async (table_name) => {
            this.Logger.Log("    UNTRACK TABLE      - " + table_name);
            await this.Hasura.UntrackTable(table_name);
        });
    }


    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all tables and views in the specified schema 
    async trackTables(tables) {
        this.Logger.Log("");
        this.Logger.Log("Configure HASURA TABLE/VIEW TRACKING");

        tables.map(async (table_name) => {
            this.Logger.Log("    TRACK TABLE        - " + table_name);

            var query = {
                type: "pg_track_table",
                args: {
                    source: this.config.targetDatabase, 
                    schema: this.config.targetSchema,
                    name: table_name,
                    configuration: {
                        custom_name: table_name
                    }
                }
            };

            await this.Hasura.runGraphQL_Query('/v1/metadata', query).catch(e => {

                if (e.response.data.error.includes("already tracked")) {
                    return;
                }

                this.Logger.Log("GRAPHQL QUERY FAILED TO EXECUTE: ");
                this.Logger.Log("");
                this.Logger.Log(JSON.stringify(query));
                this.Logger.Log("");
                this.Logger.Log("EXCEPTION DETAILS - creating " + currentRelationshipType + " - " + currentRelationshipName);
                this.Logger.Log("");
                this.Logger.Log(e.response.request.data);
                this.Logger.Log("");
            });;
        });
    }

    //#endregion


    //#region View Generation

    // --------------------------------------------------------------------------------------------------------------------------
    // Execute SQL scripts required before view creation
    async executeScriptsBeforeViewBuilder() {
        if (this.config.scripts && this.config.scripts.beforeViews) {
          
            this.config.scripts.beforeViews.map(async (script) => {
                await this.Hasura.executeSqlScript(script);
                this.Logger.Log("    EXECUTED           - " + script);
            });
        }
    }

    // --------------------------------------------------------------------------------------------------------------------------
    // Execute SQL scripts required after view creation
    async executeScriptsAfterViewBuilder() {
        if (this.config.scripts && this.config.scripts.afterViews) {
            
            this.config.scripts.afterViews.map(async (script) => {
                await this.Hasura.executeSqlScript(script);
                this.Logger.Log("    EXECUTED       - " + script);
            });
        }
    }

    //--------------------------------------------------------------------------------------------------------------------------
    // Create Postgres views that flatten JSON payloads into SQL columns
    async createJsonViews() {
        if (this.config.views) {
            this.config.views.map(async (viewFile) => {
                await this.Hasura.generateJsonView(viewFile);
                this.Logger.Log("    BUILT              - " + viewFile);
            });
        }
    }

    //#endregion
}

module.exports = QikTrack;
