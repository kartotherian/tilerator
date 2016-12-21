'use strict';

const BBPromise = require('bluebird');
const sUtil = require('../lib/util');
const fs = BBPromise.promisifyAll(require('fs'));
const path = require('path');


/**
 * The main router object
 */
const router = sUtil.router();

/**
 * The main application object reported when this module is require()d
 */
let app;

// Swagger-ui helpfully exporting the absolute path of its dist directory
const docRoot = `${require('swagger-ui').dist}/`;

/**
 * GET /robots.txt
 * Instructs robots no indexing should occur on this domain.
 */
router.get('/robots.txt', (req, res) => {

    res.set({
        'User-agent': '*',
        'Disallow': '/'
    }).end();

});


/**
 * GET /
 * Main entry point. Currently it only responds if the spec or doc query
 * parameter is given, otherwise lets the next middleware handle it
 */
router.get('/', (req, res, next) => {

    if ({}.hasOwnProperty.call(req.query || {}, 'spec')) {
        res.json(app.conf.spec);
    } else if ({}.hasOwnProperty.call(req.query || {}, 'doc')) {
        const reqPath = req.query.path ? req.query.path : '/index.html';
        const filePath = path.join(docRoot, reqPath);

        // Disallow relative paths.
        // Test relies on docRoot ending on a slash.
        if (filePath.substring(0, docRoot.length) !== docRoot) {
            throw new Error("Invalid path.");
        }

        fs.readFileAsync(filePath)
        .then((body) => {
            if (reqPath === '/index.html') {
                body = body.toString()
                    .replace(/((?:src|href)=['"])/g, '$1?doc&path=')
                    // Some self-promotion
                    .replace(/<a id="logo".*?<\/a>/,
                            `<a id="logo" href="${app.info.homepage}">${app.info.name}</a>`)
                    .replace(/<title>[^<]*<\/title>/, `<title>${app.info.name}</title>`)
                    // Replace the default url with ours, switch off validation &
                    // limit the size of documents to apply syntax highlighting to
                    .replace(/Sorter: "alpha"/, 'Sorter: "alpha", validatorUrl: null, ' +
                        'highlightSizeThreshold: 10000')
                    .replace(/docExpansion: "none"/, 'docExpansion: "list"')
                    .replace(/ url: url,/, 'url: "/?spec",');
            }

            let contentType = 'text/html';
            if (/\.js$/.test(reqPath)) {
                contentType = 'text/javascript';
                body = body.toString()
                    .replace(/underscore-min\.map/, '?doc&path=lib/underscore-min.map');
            } else if (/\.png$/.test(reqPath)) {
                contentType = 'image/png';
            } else if (/\.map$/.test(reqPath)) {
                contentType = 'application/json';
            } else if (/\.ttf$/.test(reqPath)) {
                contentType = 'application/x-font-ttf';
            } else if (/\.css$/.test(reqPath)) {
                contentType = 'text/css';
                body = body.toString().replace(/\.\.\/(images|fonts)\//g, '?doc&path=$1/');
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('content-security-policy', "default-src 'none'; " +
                            "script-src 'self' 'unsafe-inline'; connect-src *; " +
                            "style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self';");
            res.send(body.toString());
        })
        .catch({ code: 'ENOENT' }, () => {
            res.status(404)
                .type('not_found')
                .send('not found');
        });
    } else {
        next();
    }

});


module.exports = (appObj) => {

    app = appObj;

    return {
        path: '/',
        skip_domain: true,
        router
    };

};

