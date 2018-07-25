/* eslint-disable no-console */


const bunyan = require('bunyan');

function logStream(logStdout) {
  const log = [];
  const parrot = bunyan.createLogger({
    name: 'test-logger',
    level: 'warn',
  });

  function write(chunk) {
    try {
      const entry = JSON.parse(chunk);
      const levelMatch = /^(\w+)/.exec(entry.levelPath);
      if (logStdout && levelMatch) {
        const level = levelMatch[1];
        if (parrot[level]) {
          parrot[level](entry);
        }
      }
    } catch (e) {
      console.error('something went wrong trying to parrot a log entry', e, chunk);
    }

    log.push(chunk);
  }

  // to implement the stream writer interface
  function end() {
  }

  function get() {
    return log;
  }

  function slice() {
    const begin = log.length;
    let end = null; // eslint-disable-line no-shadow

    function halt() {
      if (end === null) {
        end = log.length;
      }
    }

    function get() { // eslint-disable-line no-shadow
      return log.slice(begin, end);
    }

    /* Disable eslint object-shorthand until Node 4 support is dropped */
    /* eslint-disable object-shorthand */
    return {
      halt: halt,
      get: get,
    };
  }

  return {
    write: write,
    end: end,
    slice: slice,
    get: get,
  };
}

module.exports = logStream;
