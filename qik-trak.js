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
<<<<<<< HEAD
        this.config = cfg;

        if (!cfg.primaryKeySuffix) {
            this.config.primaryKeySuffix = "_id";
        }
        
        // --------------------------------------------------------------------------------------------------------------------------
        // SQL to acquire table and foreign key metadata

        this.config.table_sql =
`
SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.config.targetSchema}'
UNION
SELECT table_name FROM information_schema.views WHERE table_schema = '${this.config.targetSchema}'
ORDER BY table_name
;`;

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

        this.tracker_log("--------------------------------------------------------------");
        this.tracker_log("");
        this.tracker_log("        qik-track          : Rapid, intuitive Hasura tracking setup");
        this.tracker_log("");
        this.tracker_log("        IN CONTAINER       : " + this.config.inContainer ? 'yes' : 'no');
        this.tracker_log("");
        this.tracker_log("        DATABASE           : '" + this.config.targetDatabase + "'");
        this.tracker_log("        SCHEMA             : '" + this.config.targetSchema + "'");
        this.tracker_log("        HASURA ENDPOINT    : '" + this.config.hasuraEndpoint + "'");
        this.tracker_log("        PRIMARY KEY SUFFIX : '" + this.config.primaryKeySuffix + "'");
        this.tracker_log("");
        this.tracker_log("--------------------------------------------------------------");
        this.tracker_log("");

        // In a docker build the database container needs time to 
        // startup and initialise, so we wait 10 seconds
        const timeout = this.config.inContainer ? 10000 : 1;

        // The tracking operations are staggered 
        // This may be clunky, but seems to fix a race condition
        // where table tracking possiblydoesn't complete before
        // relationship tracking setup begins
        setTimeout(() => {this.runUntrack()}, timeout);
        setTimeout(() => {this.runTrackTables()}, timeout + 2000);
        setTimeout(() => {this.runTrackRelationships()}, timeout + 5000);
    }

    async runUntrack() {

    if (!this.config.operations.untrack)
        return true;

    await this.runSQL_Query(this.config.table_sql)
    .then(async (results) => {

        var tables = results
            .map(t => t[0])
            .splice(1);
=======
        this.config = 
            {
            ...cfg,
            JsonViews:[]
            };

        this.Logger = new QikTrakLogger(this.config);
        this.Hasura = new QikTrakHasura(this.config);
        this.config.Logger = this.Logger;
>>>>>>> 5be04e37e07a4ff127d8bf97465e748a8c061761

        // --------------------------------------------------------------------------------------------------------------------------
        // Drop tracking information for all tables / views, this will also untrack any relationships
        await this.untrackTables(tables);
    });
}

<<<<<<< HEAD
    async runTrackTables(){

    if (!this.config.operations.trackTables)
        return;
        
    await this.runSQL_Query(this.config.table_sql)
        .then(async (results) => {

            var tables = results
                .map(t => t[0])
                .splice(1);
=======
        this.table_sql =
`
 SELECT table_name FROM information_schema.tables WHERE table_schema = '${this.config.targetSchema}'
 UNION
 SELECT table_name FROM information_schema.views WHERE table_schema = '${this.config.targetSchema}'
 ORDER BY table_name;
 `;

        this.foreignKey_sql =
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
        if (!this.config.primaryKeySuffix) {
            this.config.primaryKeySuffix = "_id";
        }

        this.Logger.Log("--------------------------------------------------------------");
        this.Logger.Log("");
        this.Logger.Log("qik-track          : Rapid, intuitive Hasura tracking setup");
        this.Logger.Log("");
        this.Logger.Log("DATABASE           : '" + this.config.targetDatabase + "'");
        this.Logger.Log("SCHEMA             : '" + this.config.targetSchema + "'");
        this.Logger.Log("HASURA ENDPOINT    : '" + this.config.hasuraEndpoint + "'");
        this.Logger.Log("PRIMARY KEY SUFFIX : '" + this.config.primaryKeySuffix + "'");
        this.Logger.Log("");
        this.Logger.Log("--------------------------------------------------------------");
        this.Logger.Log("");


        if (this.config.operations.untrack) {

            await this.Hasura.runSQL_Query(this.table_sql)
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

        if (this.config.operations.executeSqlScripts) {
            this.Logger.Log("EXECUTE SQL SCRIPTS BEFORE VIEW BUILDER");
            await this.executeScriptsBeforeViewBuilder();
            this.Logger.Log("");
        }

        if (this.config.operations.createJsonViews) {
            this.Logger.Log("GENERATE JSON VIEWS");
            await this.createJsonViews();
            this.Logger.Log("");
        }

        if (this.config.operations.executeSqlScripts) {
            this.Logger.Log("EXECUTE SQL SCRIPTS AFTER VIEW BUILDER");
            await this.executeScriptsAfterViewBuilder();
            this.Logger.Log("");
        }

        if (this.config.operations.trackTables) {
            await this.Hasura.runSQL_Query(this.table_sql)
                .then(async (results) => {
>>>>>>> 5be04e37e07a4ff127d8bf97465e748a8c061761

            // --------------------------------------------------------------------------------------------------------------------------
            // Configure HASURA to track all TABLES and VIEWS - tables and views are added to the GraphQL schema automatically
            await this.trackTables(tables);
        });
    }

    async runTrackRelationships() {
    
    if (!this.config.operations.trackRelationships)
        return;

    // Create the list of relationships required by foreign keys
    await this.runSQL_Query(this.config.foreignKey_sql)
        .then(async (results) => {

            var foreignKeys = results.splice(1)
                .map(fk => {
                    return {
                        table1: fk[0],
                        key1: fk[1],
                        table2: fk[2],
                        key2: fk[3],
                        addArrayRelationship: true,
                        addObjectRelationship: true
                    };
                });

<<<<<<< HEAD
            // --------------------------------------------------------------------------------------------------------------------------
            // Configure HASURA to track all FOREIGN KEY RELATIONSHIPS - enables GraphQL to fetch related (nested) entities
            await this.trackRelationships(foreignKeys);
            this.tracker_log("");
        });

    }

    // Setup of relationship naming should be done before execution of the auto tracker
    //#region Relationship naming

    //#endregion

=======
        if (this.config.operations.trackRelationships) {

            // Create the list of relationships required by foreign keys
            await this.Hasura.runSQL_Query(this.foreignKey_sql)
                .then(async (results) => {

                    var foreignKeys = results.splice(1)
                        .map(fk => {
                            return {
                                referencing_table: fk[0],
                                referencing_key: fk[1],
                                referenced_table: fk[2],
                                referenced_key: fk[3]
                            };
                        });

                    // --------------------------------------------------------------------------------------------------------------------------
                    // Configure HASURA to track all FOREIGN KEY RELATIONSHIPS - enables GraphQL to fetch related (nested) entities
                    await this.trackRelationships(foreignKeys);
                    this.Logger.Log("");
                });

            // track relationships created by JSON views
            this.config.JsonViews.map(async(relationship) =>{
                await this.createRelationships(relationship);
            });
        }
    }

>>>>>>> 5be04e37e07a4ff127d8bf97465e748a8c061761
    //#region Table Tracking

    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all tables and views in the specified schema 
    async untrackTables(tables) {
        this.Logger.Log("REMOVE PREVIOUS HASURA TRACKING DETAILS FOR TABLES AND VIEWS");

        tables.map(async (table_name) => {
            this.Logger.Log("    UNTRACK TABLE      - " + table_name);

            var query = {
                type: "pg_untrack_table",
                args: {
                    table: {
                        schema: this.config.targetSchema,
                        name: table_name
                    },
                    source: this.config.targetDatabase, 
                    cascade: true
                }
            };

            await this.Hasura.runGraphQL_Query('/v1/metadata',  query)
                .catch(e => {
                    if (e.response.data.error.includes("already untracked")) {
                        return;
                    }

                    this.Logger.Log("");
                    this.Logger.Log("");
                    this.Logger.Log("--------------------------------------------------------------");
                    this.Logger.Log("");
                    this.Logger.Log("QIK-TRAK: ERROR");
                    this.Logger.Log("");
                    this.Logger.Log("GRAPHQL QUERY FAILED TO EXECUTE");
                    this.Logger.Log("");
                    this.Logger.Log("Error Message : " + e.response.data.internal.error.message);
                    this.Logger.Log(e.response.request.data);
                    this.Logger.Log("");
                    this.Logger.Log("Query:");
                    this.Logger.Log("");
                    this.Logger.Log(JSON.stringify(query));
                    this.Logger.Log("");
                    this.Logger.Log("Are Hasura and the database fully initialised?");
                    this.Logger.Log("");
                    this.Logger.Log("--------------------------------------------------------------");
                });;
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

<<<<<<< HEAD
            await this.runGraphQL_Query('/v1/metadata', query)
            .catch(e => {
=======
            await this.Hasura.runGraphQL_Query('/v1/metadata', query).catch(e => {
>>>>>>> 5be04e37e07a4ff127d8bf97465e748a8c061761

                if (e.response.data.error.includes("already tracked")) {
                    return;
                }

<<<<<<< HEAD
                this.tracker_log("GRAPHQL QUERY FAILED TO EXECUTE: ");
                this.tracker_log("");
                this.tracker_log(JSON.stringify(query));
                this.tracker_log("");
                this.tracker_log("EXCEPTION DETAILS - creating " + currentRelationshipType + " - " + currentRelationshipName);
                this.tracker_log("");
                this.tracker_log(e.response.request.data);
                this.tracker_log("");
            });
=======
                this.Logger.Log("GRAPHQL QUERY FAILED TO EXECUTE: ");
                this.Logger.Log("");
                this.Logger.Log(JSON.stringify(query));
                this.Logger.Log("");
                this.Logger.Log("EXCEPTION DETAILS - creating " + currentRelationshipType + " - " + currentRelationshipName);
                this.Logger.Log("");
                this.Logger.Log(e.response.request.data);
                this.Logger.Log("");
            });;
>>>>>>> 5be04e37e07a4ff127d8bf97465e748a8c061761
        });
    }

    //#endregion


    //#region Relationship Tracking

    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all relationships
    // This requires an array relationship in one direction and an object relationship in the opposite direction
    async trackRelationships(relationships) {
        this.Logger.Log("");
        this.Logger.Log("Configure HASURA RELATIONSHIP TRACKING");

        relationships.map(async (relationship) => {
            await this.Hasura.createRelationships(relationship);
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
