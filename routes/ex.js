'use strict';


const BBPromise = require('bluebird');
const sUtil = require('../lib/util');
const fs = BBPromise.promisifyAll(require('fs'));

// shortcut
const HTTPError = sUtil.HTTPError;


/**
 * The main router object
 */
const router = sUtil.router();

/*
 *  ERROR EXAMPLES
 */


/**
 * GET /err/array
 * An example route creating an invalid array to show generic,
 * direct error handling
 */
router.get('/err/array', (req, res) => {

    // let's create an array with -1 elems!
    const arr = new Array(-1);
    // this is never reached
    res.send(arr.join());

});


/**
 * GET /err/file
 * Showcases promise error handling. The function is trying to
 * read a non-existent file, which will produce an error,
 * automatically handled by the template.
 */
router.get('/err/file', (req, res) => {

    // NOTE the return statement here, the promise
    // must be returned!
    // read the file
    return fs.readFileAsync('../mushrooms.txt')
    // and then send it back to the caller
    .then((text) => {
        // note that this point is never reached
        res.send(text);
    });

});


/**
 * GET /err/manual/error
 * Throws a generic error manually
 */
router.get('/err/manual/error', (req, res) => {

    // simulate a constraint check
    const max = 50;
    if (max > 10) {
        throw new Error(`A maximum value of 10 is expected, ${max} given!`);
    }

});


/**
 * GET /err/manual/deny
 * Denies access to this resource endpoint
 */
router.get('/err/manual/deny', (req, res) => {

    // don't allow access
    throw new HTTPError({
        status: 403,
        type: 'access_denied',
        title: 'Access denied',
        detail: 'No access is allowed to this endpoint'
    });

});


/**
 * GET /err/manual/auth
 */
router.get('/err/manual/auth', (req, res) => {

    // pretend to read a token file
    // again, note the return statement
    return fs.readFileAsync(`${__dirname}/../static/index.html`)
    // and pretend to compare it with what the user sent
    .then((token) => {
        if (!req.params || req.params.token !== token) {
            // nope, not authorised to be here, sorry
            throw new HTTPError({
                status: 401,
                type: 'unauthorized',
                title: 'Unauthorized',
                detail: 'You are not authorized to fetch this endpoint!'
            });
        }
    });

});


module.exports = (appObj) => {

    return {
        path: '/ex',
        skip_domain: true,
        router
    };

};

