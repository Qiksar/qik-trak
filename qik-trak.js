const axios = require("axios");
const NamesHelper = require("./qik-trak-names");

const QikTrakNames = new NamesHelper();

//
// The purpose of this code is to allow the caller to track all Postgres tables, views and relationships with a single call
// which goes to support continuous integration as you no longer have to use the Hasura UI to click the buttons to track all tables/relationships.
//
// The code also creates SQL views which can translate JSON values into SQL data columns
//

const fs = require('fs');


class QikTrack {

    constructor(cfg){
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

        // --------------------------------------------------------------------------------------------------------------------------
        // Drop tracking information for all tables / views, this will also untrack any relationships
        await this.untrackTables(tables);
    });
}

    async runTrackTables(){

    if (!this.config.operations.trackTables)
        return;
        
    await this.runSQL_Query(this.config.table_sql)
        .then(async (results) => {

            var tables = results
                .map(t => t[0])
                .splice(1);

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

            // --------------------------------------------------------------------------------------------------------------------------
            // Configure HASURA to track all FOREIGN KEY RELATIONSHIPS - enables GraphQL to fetch related (nested) entities
            await this.trackRelationships(foreignKeys);
            this.tracker_log("");
        });

    }

    // Setup of relationship naming should be done before execution of the auto tracker
    //#region Relationship naming

    //#endregion

    //#region Table Tracking

    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all tables and views in the specified schema 
    async untrackTables(tables) {
        this.tracker_log("REMOVE PREVIOUS HASURA TRACKING DETAILS FOR TABLES AND VIEWS");

        tables.map(async (table_name) => {
            this.tracker_log("    UNTRACK TABLE      - " + table_name);

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

            await this.runGraphQL_Query('/v1/metadata',  query)
                .catch(e => {
                    if (e.response.data.error.includes("already untracked")) {
                        return;
                    }

                    this.tracker_log("");
                    this.tracker_log("");
                    this.tracker_log("--------------------------------------------------------------");
                    this.tracker_log("");
                    this.tracker_log("QIK-TRAK: ERROR");
                    this.tracker_log("");
                    this.tracker_log("GRAPHQL QUERY FAILED TO EXECUTE");
                    this.tracker_log("");
                    this.tracker_log("Error Message : " + e.response.data.internal.error.message);
                    this.tracker_log(e.response.request.data);
                    this.tracker_log("");
                    this.tracker_log("Query:");
                    this.tracker_log("");
                    this.tracker_log(JSON.stringify(query));
                    this.tracker_log("");
                    this.tracker_log("Are Hasura and the database fully initialised?");
                    this.tracker_log("");
                    this.tracker_log("--------------------------------------------------------------");
                });;
        });
    }


    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all tables and views in the specified schema 
    async trackTables(tables) {
        this.tracker_log("");
        this.tracker_log("Configure HASURA TABLE/VIEW TRACKING");

        tables.map(async (table_name) => {
            this.tracker_log("    TRACK TABLE        - " + table_name);

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

            await this.runGraphQL_Query('/v1/metadata', query)
            .catch(e => {

                if (e.response.data.error.includes("already tracked")) {
                    return;
                }

                this.tracker_log("GRAPHQL QUERY FAILED TO EXECUTE: ");
                this.tracker_log("");
                this.tracker_log(JSON.stringify(query));
                this.tracker_log("");
                this.tracker_log("EXCEPTION DETAILS - creating " + currentRelationshipType + " - " + currentRelationshipName);
                this.tracker_log("");
                this.tracker_log(e.response.request.data);
                this.tracker_log("");
            });
        });
    }

    //#endregion


    //#region Relationship Tracking

    // --------------------------------------------------------------------------------------------------------------------------
    // Configure HASURA to track all relationships
    // This requires an array relationship in one direction and an object relationship in the opposite direction
    async trackRelationships(relationships) {
        this.tracker_log("");
        this.tracker_log("Configure HASURA RELATIONSHIP TRACKING");

        relationships.map(async (relationship) => {
            await this.createRelationships(relationship);
        });
    }

    async createRelationships(relationship) {
        if (relationship.addArrayRelationship) {
            const array_rel_spec = {
                type: "pg_create_array_relationship",
                
                args: {
                    name: QikTrakNames.getArrayRelationshipName(this.config, relationship),

                    table: {
                        schema: this.config.targetSchema,
                        name: relationship.table2
                    },
                    
                    using: {
                        foreign_key_constraint_on: {
                            table: {
                                schema: this.config.targetSchema,
                                name:  relationship.table1
                            },
                            columns: [relationship.key1]
                            }
                    }
                }
            };

            this.tracker_log("    ARRAY RELATIONSHIP - " + array_rel_spec.args.name + " -> " + relationship.table1 + " where " + relationship.table1 + "." + relationship.key1 + " matches " + relationship.table2 + "." +  relationship.key2);
            await this.createRelationship(array_rel_spec);
        }

        if (relationship.addObjectRelationship) {
            const obj_rel_spec = {
                type: "pg_create_object_relationship",
              
                args: {
                    name: QikTrakNames.getObjectRelationshipName(this.config, relationship),

                    table: {
                        schema: this.config.targetSchema,
                        name:  relationship.table1
                    },

                    using: {
                       foreign_key_constraint_on: relationship.key1
                    }
                }
            };

            this.tracker_log("   OBJECT RELATIONSHIP - " + obj_rel_spec .args.name + " is " + relationship.table1 + " referencing " + relationship.table2 + " using " +  relationship.key1);
            await this.createRelationship(obj_rel_spec);
        }
    }

    // --------------------------------------------------------------------------------------------------------------------------
    // Create the specified relationship
    async createRelationship(relSpec) {
        await this.runGraphQL_Query('/v1/metadata', relSpec)
            .catch(e => {

                if (e.response.data.error.includes("already exists")) {
                    return;
                }

                this.tracker_log("GRAPHQL QUERY FAILED TO EXECUTE: ");
                this.tracker_log("");
                this.tracker_log(JSON.stringify(relSpec));
                this.tracker_log("");
                this.tracker_log("EXCEPTION DETAILS - creating " + relSpec.type + " - " + relSpec.args.name);
                this.tracker_log("");
                this.tracker_log(e.response.data);
                this.tracker_log("");
            });
    }

    //#endregion


    //#region View Generation

    //--------------------------------------------------------------------------------------------------------------------------
    // Create Postgres views that flatten JSON payloads into SQL columns
    async generateViews() {
        // --------------------------------------------------------------------------------------------------------------------------
        // Execute SQL scripts required before view creation
        if (this.config.scripts && this.config.scripts.beforeViews) {
            this.executeScripts(this.config.scripts.beforeViews);
        }

        this.tracker_log("CREATE SQL VIEWS");

        this.config.views.map((view) => {
            this.generateView(view);
        });

        // --------------------------------------------------------------------------------------------------------------------------
        // Execute SQL scripts required after view creation
        if (this.config.scripts && this.config.scripts.afterViews) {
            await this.executeScripts(this.config.scripts.afterViews);
        }
    }


    //--------------------------------------------------------------------------------------------------------------------------
    // Create the view: DROP if exists, create view, add comment to view
    async generateView(view) {
        this.tracker_log("    CREATE VIEW - " + view.name);

        if (view.relationships) {
            view.relationships.map(relationship => {
                this.config.relationships.push({ ...relationship, srcTable: view.name });
            });
        }

        const view_header =
            `
DROP VIEW IF EXISTS "${this.config.targetSchema}"."${view.name}";
CREATE VIEW "${this.config.targetSchema}"."${view.name}" AS
`;

        const view_footer =
            `
COMMENT ON VIEW "${this.config.targetSchema}"."${view.name}" IS '${view.description}';
`;

        // Build the SQL statement according to the specified JSON columns
        // The columns list is optional
        var view_columns = ""

        if (view.columns) {
            var view_columns = ","

            view.columns.jsonValues.map(col => {
                view_columns +=
                    `
CAST(${view.columns.jsonColumn} ->> '${col.jsonName}' AS ${col.sqlType}) AS "${col.sqlName}",`;
            });

        }

        var sql_statement = `
 ${view_header}
 ${view.query.select.trim().replace(/,\s*$/, "")}
 ${view_columns.trim().replace(/,\s*$/, "")}
 ${view.query.from}
 ${view.query.join}
 ${view.query.where}
 ${view.query.orderBy};
 ${view_footer};`;

        await this.runSQL_Query(sql_statement)
            .then(() => {
                this.tracker_log("Created ${view.name}")
            });
    }

    //#endregion


    //#region Hasura API Calls

    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a list of SQL scripts
    async executeScripts(scripts) {
        this.tracker_log("");
        this.tracker_log("EXECUTE SQL SCRIPTS");

        scripts.map(async (s) => {

            var content = fs.readFileSync(s.source, { encoding: "utf8" });
            this.tracker_log("    EXECUTE SQL SCRIPT - " + s.source);

            if (content.trim().length > 0) {
                await this.runSQL_Query(content);
            }

        });

        this.tracker_log("");
    }


    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a Postgres SQL query via the Hasura API
    async runSQL_Query(sql_statement) {
        if (!sql_statement)
            throw ("sql_statement is required");

        var sqlQuery = {
            type: "run_sql",
            args: {
                sql: sql_statement
            }
        };

        return await this.runGraphQL_Query('/v2/query', sqlQuery)
            .then(results => {
                return results.data.result;
            }).catch(e => {
                this.tracker_log("");
                this.tracker_log("");
                this.tracker_log("--------------------------------------------------------------");
                this.tracker_log("");
                this.tracker_log("QIK-TRAK: ERROR");
                this.tracker_log("");
                this.tracker_log("SQL QUERY FAILED TO EXECUTE: ");
                this.tracker_log("");
                this.tracker_log("ENDPOINT ADDRESS : " + this.config.hasuraEndpoint);
                this.tracker_log("");

                if (!e.response)
                    this.tracker_log("Error Message : " + e);
                else
                    this.tracker_log("Error Message : " + e.response.data.internal.error.message);

                this.tracker_log("");
                this.tracker_log("SQL Statement:");
                this.tracker_log("");
                this.tracker_log(sql_statement);
                this.tracker_log("");
                this.tracker_log("Check for SQL syntax errors. Test the query in your admin tool.");
                this.tracker_log("");
                this.tracker_log("--------------------------------------------------------------");
            });
    }


    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a GraphQL query via the Hasura API
    async runGraphQL_Query(endpoint, query) {
        if (!query)
            throw ("query is required");

        if (!endpoint)
            throw ("endpoint is required");

        if (!this.config.hasuraAdminSecret)
            throw ("hasuraAdminSecret is required");

        const requestConfig = {
            headers: {
                'X-Hasura-Admin-Secret': this.config.hasuraAdminSecret,
            }
        }

        return await axios.post(this.config.hasuraEndpoint + endpoint, query, requestConfig)
            .then(result => {
                return result;
            });
    }

    //#endregion


    //#region Utilities

    //--------------------------------------------------------------------------------------------------------------------------
    // Write log text if output is requested by the this.config
    tracker_log(text) {
        if (this.config.logOutput) {
            console.log(text);
        }
    }

    //#endregion
}

module.exports = QikTrack;
