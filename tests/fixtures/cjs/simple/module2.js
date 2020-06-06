'use strict';

function fn() {
  return 'module2: fn';
}

const v = 'module2: value';

module.exports = {
  fn,
  v,
};
