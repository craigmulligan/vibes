import { spec } from "node:test/reporters";
import { Transform } from 'node:stream';

class Reporter extends Transform {
  // This is a custom test reporter for node:test
  // it'll only log console.logs that occur during 
  // failed tests. For everything else it delegates
  // to the default "spec" reporter.
  constructor() {
    super({ writableObjectMode: true })
    this.specReporter = new spec()
    this.logs = []
  }

  addToFailedLogs = (_, data) => {
    this.logs.push(data)
  }

  _transform(event, encoding, callback) {
    switch (event.type) {
      case 'test:stderr':
      case 'test:stdout':
        this.logs.push(this.specReporter._transform(event, encoding, this.addToFailedLogs));
        callback(null)
        break;
      case 'test:pass':
        this.specReporter._transform(event, encoding, callback);
        this.logs = [];
        break;
      case 'test:fail':
        this.specReporter._transform(event, encoding, this.addToFailedLogs);
        callback(null, this.logs.join(''))
        this.logs = []
        break;
      default:
        this.specReporter._transform(event, encoding, callback);
        break;
    }

  }

  _flush(callback) {
    this.specReporter._flush(callback)
  }
}

export default new Reporter()
