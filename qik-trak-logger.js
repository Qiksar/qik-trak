
class Logger {

    constructor(config) {
        if(!config)
            throw ("config is required")

        this.config = config;
    }
    
    Log(text) {
        if (this.config.logOutput) {
            console.log(text);
        }
    }
}

module.exports = Logger;