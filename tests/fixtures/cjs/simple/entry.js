'use strict';

const module1 = require('./module1');

console.log('entry');

module1();

const module3 = require('./module3');

console.log('sep----');

module3('from entry.js');
