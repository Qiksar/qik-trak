const axios = require("axios");
const fs = require('fs');
const QikTrakNames = require("./qik-trak-names");

class QikTrakHasura {

    constructor(config) {
        if(!config)
            throw ("config is required")

        this.config = config;
        this.Namer = new QikTrakNames(config);
    }

    async UntrackTable(table_name) {
        
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

                this.Config.Logger.Log("");
                this.Config.Logger.Log("");
                this.Config.Logger.Log("--------------------------------------------------------------");
                this.Config.Logger.Log("");
                this.Config.Logger.Log("QIK-TRAK: ERROR");
                this.Config.Logger.Log("");
                this.Config.Logger.Log("GRAPHQL QUERY FAILED TO EXECUTE");
                this.Config.Logger.Log("");
                this.Config.Logger.Log("Error Message : " + e.response.data.internal.error.message);
                this.Config.Logger.Log(e.response.request.data);
                this.Config.Logger.Log("");
                this.Config.Logger.Log("Query:");
                this.Config.Logger.Log("");
                this.Config.Logger.Log(JSON.stringify(query));
                this.Config.Logger.Log("");
                this.Config.Logger.Log("Are Hasura and the database fully initialised?");
                this.Config.Logger.Log("");
                this.Config.Logger.Log("--------------------------------------------------------------");
            });;
    }

    async createRelationships(relationship) {
        const array_rel_spec = {
            type: "pg_create_array_relationship",
            
            args: {
                name: this.Namer.getArrayRelationshipName(relationship),

                table:  {
                    schema: this.config.targetSchema,
                    name: relationship.referenced_table
                },
                
                using: {
                    manual_configuration: {
                        remote_table: {
                            schema: this.config.targetSchema,
                            name: relationship.referencing_table
                        },
                        column_mapping:{ 
                        }
                    }
                }
            }
        };

        array_rel_spec.args.using.manual_configuration.column_mapping[relationship.referenced_key] = relationship.referencing_key;

        this.config.Logger.Log("    ARRAY RELATIONSHIP - " + array_rel_spec.args.name + " -> " + relationship.referencing_table + " where " + relationship.referencing_table + "." + relationship.referencing_key + " matches " + relationship.referenced_table + "." +  relationship.referenced_key);
        await this.createRelationship(array_rel_spec);

        const obj_rel_spec = {
            type: "pg_create_object_relationship",
            
            args: {
                name: this.Namer.getObjectRelationshipName(relationship),

                table: {
                    schema: this.config.targetSchema,
                    name:  relationship.referencing_table
                },
                using: {
                    manual_configuration: {
                        remote_table: {
                            schema: this.config.targetSchema,
                            name: relationship.referenced_table
                        },
                        column_mapping:{ 
                        }
                    }
                }
            }
        };

        array_rel_spec.args.using.manual_configuration.column_mapping[relationship.referencing_key] = relationship.referenced_key;

        this.config.Logger.Log("   OBJECT RELATIONSHIP - " + obj_rel_spec .args.name + " is " + relationship.referencing_table + " referencing " + relationship.referenced_table + " using " +  relationship.referencing_key);
        await this.createRelationship(obj_rel_spec);
    }

    // --------------------------------------------------------------------------------------------------------------------------
    // Create the specified relationship
    async createRelationship(relSpec) {
        await this.runGraphQL_Query('/v1/metadata', relSpec)
            .catch(e => {

                if (e.response.data.error.includes("already exists")) {
                    return;
                }

                this.config.Logger.Log("GRAPHQL QUERY FAILED TO EXECUTE: ");
                this.config.Logger.Log("");
                this.config.Logger.Log(JSON.stringify(relSpec));
                this.config.Logger.Log("");
                this.config.Logger.Log("EXCEPTION DETAILS - creating " + relSpec.type + " - " + relSpec.args.name);
                this.config.Logger.Log("");
                this.config.Logger.Log(e.response.data);
                this.config.Logger.Log("");
            });
    }

    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a list of SQL scripts
    async executeSqlScript(scriptFilename) {
        var content = fs.readFileSync(scriptFilename, { encoding: "utf8" });

        if (content.trim().length > 0) {
            await this.runSQL_Query(content);
        }
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
                this.config.Logger.Log("");
                this.config.Logger.Log("");
                this.config.Logger.Log("--------------------------------------------------------------");
                this.config.Logger.Log("");
                this.config.Logger.Log("QIK-TRAK: ERROR");
                this.config.Logger.Log("");
                this.config.Logger.Log("SQL QUERY FAILED TO EXECUTE: ");
                this.config.Logger.Log("");
                this.config.Logger.Log("ENDPOINT ADDRESS : " + this.config.hasuraEndpoint);
                this.config.Logger.Log("");

                if (!e.response)
                    this.config.Logger.Log("Error Message : " + e);
                else
                    this.config.Logger.Log("Error Message : " + e.response.data.error);

                this.config.Logger.Log("");
                this.config.Logger.Log("SQL Statement:");
                this.config.Logger.Log("");
                this.config.Logger.Log(sql_statement);
                this.config.Logger.Log("");
                this.config.Logger.Log("Check for SQL syntax errors. Test the query in your admin tool.");
                this.config.Logger.Log("");
                this.config.Logger.Log("--------------------------------------------------------------");
            });
    }


    //--------------------------------------------------------------------------------------------------------------------------
    // Execute a GraphQL query via the Hasura API
    async runGraphQL_Query(endpoint, query) {
      
        if (!endpoint)
            throw ("endpoint is required");
        
        if (!query)
            throw ("query is required");

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


    //--------------------------------------------------------------------------------------------------------------------------
    // Generate views that surface JSON attributes as SQL columns
    //
    // For example: Imagine we have a data table for IoT devices, and the devices send data to the database as JSON. The table might have a message_id and then message contant in JSON.
    //              we want to surface JSON values as SQL data, else GraphQL can't see it or query it.
    //
    async generateJsonView(viewFile) {
        const content = fs.readFileSync(viewFile, { encoding: "utf8" });
        const root = JSON.parse(content);

        root.views.map(async (view) =>  {
            await this.buildJsonView(view);
        });
    }

    //--------------------------------------------------------------------------------------------------------------------------
    // Build a specific JSON view
    async buildJsonView(view) {
      
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
`CAST(${view.columns.jsonColumn} ->> '${col.jsonName}' AS ${col.sqlType}) AS "${col.sqlName}",`;
            });

        }

        var sql_statement = 
`
 ${view_header}
 ${view.query.select.trim().replace(/,\s*$/, "")}
 ${view_columns.trim().replace(/,\s*$/, "")}
 ${view.query.from}
 ${view.query.join}
 ${view.query.where}
 ${view.query.orderBy};
 ${view_footer};
`;

        await this.runSQL_Query(sql_statement);

        // Relationship tracking has to be deferred until trable tracking is complete
        if (view.relationships) {
            view.relationships.map(async (relationship) => {
                this.config.JsonViewRelationships.push(relationship);
            });
        }
    }
}

module.exports = QikTrakHasura;