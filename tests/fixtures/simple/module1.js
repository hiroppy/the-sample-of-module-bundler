'use strict';

module.exports = () => {
  console.log('module1');

  const { fn, v } = require('./module2');

  console.log(v);
  console.log(fn());

  const module3 = require('./module3');

  module3('from module1.js');
};
