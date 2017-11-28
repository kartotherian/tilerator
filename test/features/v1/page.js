/* global describe, it, before, after */

'use strict';


const preq   = require('preq');
const assert = require('../../utils/assert.js');
const server = require('../../utils/server.js');

if (!server.stopHookAdded) {
    server.stopHookAdded = true;
    after(() => server.stop());
}

describe('page gets', function() {

    this.timeout(20000); // eslint-disable-line no-invalid-this

    before(() => { return server.start(); });

    // common URI prefix for the page
    const uri = `${server.config.uri}en.wikipedia.org/v1/page/Table_(database)/`;

    it('should get the whole page body', () => {
        return preq.get({
            uri
        }).then((res) => {
            // check the status
            assert.status(res, 200);
            // check the returned Content-Type header
            assert.contentType(res, 'text/html');
            // inspect the body
            assert.notDeepEqual(res.body, undefined, 'No body returned!');
            // this should be the right page
            if (!/Table_\(database\)#cite/.test(res.body)) {
                throw new Error('Not the title I was expecting!');
            }
        });
    });

    it('should get only the leading section', () => {
        return preq.get({
            uri: `${uri}lead`
        }).then((res) => {
            // check the status
            assert.status(res, 200);
            // check the returned Content-Type header
            assert.contentType(res, 'text/html');
            // inspect the body
            assert.notDeepEqual(res.body, undefined, 'No body returned!');
            // this should be the right page
            if (!/Table/.test(res.body)) {
                throw new Error('Not the page I was expecting!');
            }
            // .. and should start with <div id="lead_section">
            if (!/^<div id="lead_section">/.test(res.body)) {
                throw new Error('This is not a leading section!');
            }
        });
    });

    it('should throw a 404 for a non-existent page', () => {
        return preq.get({
            uri: `${server.config.uri}en.wikipedia.org/v1/page/Foobar_and_friends`
        }).then((res) => {
            // if we are here, no error was thrown, not good
            throw new Error('Expected an error to be thrown, got status: ', res.status);
        }, (err) => {
            // inspect the status
            assert.deepEqual(err.status, 404);
        });
    });
});

