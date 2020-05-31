((modules) => {
    const usedModules = {};

    function require(moduleId) {
      if (usedModules[moduleId]) {
        return usedModules[moduleId].exports;
      }

      const module = usedModules[moduleId] = {
        exports: {}
      };

      modules[moduleId](module, module.exports, require);

      return module.exports;
    }
    
    return require(0);
  })({
    0: function(module, exports, require) {
    'use strict';

const module1 = require(1);

console.log('entry');
module1();

const module3 = require(3);

console.log('sep----');
module3('from entry.js');
  },1: function(module, exports, require) {
    'use strict';

module.exports = () => {
  console.log('module1');

  const {
    fn,
    v
  } = require(2);

  console.log(v);
  console.log(fn());

  const module3 = require(3);

  module3('from module1.js');
};
  },2: function(module, exports, require) {
    'use strict';

function fn() {
  return 'module2: fn';
}

const v = 'module2: value';
module.exports = {
  fn,
  v
};
  },3: function(module, exports, require) {
    function m(txt) {
  console.log('module3', txt);
}

module.exports = m;
  }
  });