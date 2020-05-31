'use strict';

const parser = require('@babel/parser');

const parserOption = {
  sourceType: 'module', // for esm
};

function parse(code) {
  return parser.parse(code, parserOption);
}

module.exports = {
  parse,
};
