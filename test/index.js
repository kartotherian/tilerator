'use strict';

// Run eslint as part of normal testing
require('mocha-eslint')([
    'lib',
    'routes'
], {
    timeout: 10000
});
