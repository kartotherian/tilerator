/* global describe, it, before, after */


const fs = require('fs');
const preq = require('preq');
const wait = require('wait-as-promised');
const assert = require('../../utils/assert.js');
const server = require('../../utils/server.js');

function deleteIfExist(path) {
  try {
    fs.unlinkSync(path);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
}

function fileExists(file) {
  try {
    const stats = fs.statSync(file);
    return stats.isFile();
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  return false;
}

if (!server.stopHookAdded) {
  server.stopHookAdded = true;
  after(() => server.stop());
}

describe('express app', function () { // eslint-disable-line func-names
  this.timeout(20000); // eslint-disable-line no-invalid-this

  before(() => server.start());

  it('should get robots.txt', () => preq.get({
    uri: `${server.config.uri}robots.txt`,
  }).then((res) => {
    assert.deepEqual(res.status, 200);
    assert.deepEqual(res.headers.disallow, '/');
  }));

  it('should get static content gzipped', () => preq.get({
    uri: `${server.config.uri}static/admin.html`,
    headers: {
      'accept-encoding': 'gzip, deflate',
    },
  }).then((res) => {
    assert.deepEqual(res.status, 200);
    // if there is no content-length, the reponse was gzipped
    assert.deepEqual(res.headers['content-length'], undefined, 'Did not expect the content-length header!');
  }));

  it('should get static content uncompressed', () => preq.get({
    uri: `${server.config.uri}static/admin.html`,
    headers: {
      'accept-encoding': '',
    },
  }).then((res) => {
    const contentEncoding = res.headers['content-encoding'];
    assert.deepEqual(res.status, 200);
    assert.deepEqual(contentEncoding, undefined, 'Did not expect gzipped contents!');
  }));

  it('moves a tile from source to destination', () => {
    // ensure file doesn't exist yet
    deleteIfExist('test/filestore/6/33/22.png');
    return preq.post({
      uri: `${server.config.uri}add?generatorId=gen&storageId=file&zoom=6&x=33&y=22`,
    }).then((res) => {
      assert.deepEqual(res.status, 200);
      assert.deepEqual(res.body[0], 'Z=6; 1 tile at [33,22] (idx=1577); gen→file');

      return wait(() => fileExists('test/filestore/6/33/22.png'), { timeout: 15000 });
    });
  });
});
