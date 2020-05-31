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
    
    require.__defineExports = (exports, exporters) => {
      Object.entries(exporters).forEach(([key, value]) => {
        Object.defineProperty(exports, key, {
          enumerable: true,
          get: value
        });
      });
    }
    
    return require(0);
  })({
    0: function(module, exports, require) {
    const __BUNDLER__1 = require(1);

const __BUNDLER__3 = require(3);

__BUNDLER__1["default"]('from entry-point');

__BUNDLER__1["namedFunc"]();

console.log(Object.keys(__BUNDLER__3).length);
console.log(__BUNDLER__3["default"]);
console.log(__BUNDLER__3["value"]);

function __default__() {}

require.__defineExports(exports, {
  "default": () => __default__
});
  },1: function(module, exports, require) {
    const __BUNDLER__2 = require(2);

function defaultNamedExport(str) {
  console.log('1. default: named', __BUNDLER__2["value"]);
  console.log('2. default: arguments', str);

  __BUNDLER__2["default"](`from module1 ${str}`);
}

function namedFunc() {
  console.log('4. named: func');
}

function checkScope() {
  function module2Default() {}

  module2Default();
}

require.__defineExports(exports, {
  "default": () => defaultNamedExport,
  "namedFunc": () => namedFunc
});
  },2: function(module, exports, require) {
    const value = 'named: module2Value';
const value2 = 'named: module2Value2';

const __default__ = str => {
  console.log('3. default: anonymous', str);
};

require.__defineExports(exports, {
  "value": () => value,
  "value2": () => value2,
  "default": () => __default__
});
  },3: function(module, exports, require) {
    const value = '5. module3 value';
const value2 = 2;

const fn = () => {};

function fn2() {}

class A {}

require.__defineExports(exports, {
  "value": () => value,
  "value2": () => value2,
  "fn": () => fn,
  "fn2": () => fn2,
  "A": () => A,
  "default": () => value
});
  }
  });