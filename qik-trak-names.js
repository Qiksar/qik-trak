class QikTrakNames {
    
    //---------------------------------------------------------------------------------------------------------------------------
    // Default relationship name builder
    getArrayRelationshipName(config, relationship) {
        if (!config)
            throw ("config is required");

        //const name = relationship.key1.replace(config.primaryKeySuffix, "") + "_" + relationship.table1;
        const name = relationship.key1.replace(config.primaryKeySuffix, "") ;
        return name; 
    }


    //---------------------------------------------------------------------------------------------------------------------------
    // Default relationship name builder
    getObjectRelationshipName(config, relationship) {
        if (!config)
            throw ("config is required");

        return relationship.key1.replace(config.primaryKeySuffix, "");
    }

    //---------------------------------------------------------------------------------------------------------------------------
    // convert foreign_key_names into foreignKeyName
    getCamelCaseName(inputString) {
        if (!inputString)
            throw ("inputString is required");

        var text = inputString.toLowerCase()
            .replace(/[_-]/g, " ") // Break up the words in my_foreign_key_name to be like my foreign key name
            .replace(/\s[a-z]/g, (s) => s.toUpperCase()) // capitalise each word
            .replace(" ", "") // remove the space to join the words back together
            .replace(/^[A-Z]/, (s) => s.toLowerCase()) // ensure the first word is lowercased
            ;

        return text;
    }

    //---------------------------------------------------------------------------------------------------------------------------
    // handle plural words which can easily be singularised 
    getSingularName(inputString, singular) {
        if (!inputString)
            throw ("inputString is required");

        var text = inputString;

        // If the singular form of the name is required then use some simple logic to get the singular form
        // If the logic doesn't work, just return whatever text was created above
        if (singular) {

            if (["ies"].indexOf(text.slice(text.length - 3)) >= 0) {
                text = text.slice(0, text.length - 3) + "y";
            }
            else if (["us", "ss"].indexOf(text.slice(text.length - 2)) < 0) {
                if (text.slice(text.length - 1) == "s") {
                    text = text.slice(0, text.length - 1);
                }
            }
        }

        return text;
    }
}

module.exports = QikTrakNames;