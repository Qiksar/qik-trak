export default class Logger {
  public config: any;

  constructor(config: any) {
    if (!config) throw 'config is required';

    this.config = config;
  }

  Log(text: string) {
    if (this.config.logOutput) {
      console.log(text);
    }
  }
}
