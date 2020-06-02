'use strict';

const { default: world } = require('./cjs2');

function say(str) {
  console.log(`${str} from cjs`);
}

const helloWorld = `hello ${world}`;

const defaultValue = 'default from cjs';

module.exports = {
  say,
  helloWorld,
  default: defaultValue,
};
