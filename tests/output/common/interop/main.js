((modules) => {
  const usedModules = {};

  function require(moduleId) {
    if (usedModules[moduleId]) {
      return usedModules[moduleId].exports;
    }

    const module = (usedModules[moduleId] = {
      exports: {},
    });

    modules[moduleId](module, module.exports, require);

    return module.exports;
  }

  require.__defineExports = (exports, exporters) => {
    Object.entries(exporters).forEach(([key, value]) => {
      Object.defineProperty(exports, key, {
        enumerable: true,
        get: value,
      });
    });
  };

  require.__addEsmFlag = (exports) => {
    Object.defineProperty(exports, "__esModule", { value: true });
  };

  require.__getDefaultExports = (exports) => {
    const getter = exports.__esModule
      ? () => exports["default"]
      : () => exports;

    require.__defineExports(getter, { d: getter });

    return getter;
  };

  return require(5);
})({
  0: function (module, exports, require) {
    "use strict";

    const world = "world";
    module.exports = {
      default: world,
    };
  },
  1: function (module, exports, require) {
    "use strict";

    const { default: world } = require(0);

    function say(str) {
      console.log(`${str} from cjs`);
    }

    const helloWorld = `hello ${world}`;
    const defaultValue = "default from cjs";
    module.exports = {
      say,
      helloWorld,
      default: defaultValue,
    };
  },
  2: function (module, exports, require) {
    require.__addEsmFlag(exports);
    const world = "world";

    require.__defineExports(exports, {
      default: () => world,
    });
  },
  3: function (module, exports, require) {
    require.__addEsmFlag(exports);

    const __BUNDLER__2 = require(2);

    const __BUNDLER__2_DEFAULT = require.__getDefaultExports(__BUNDLER__2);

    function say(str) {
      console.log(`${str} from esm`);
    }

    const helloWorld = `hello ${__BUNDLER__2_DEFAULT.d}`;
    const defaultValue = "default from esm";

    require.__defineExports(exports, {
      say: () => say,
      helloWorld: () => helloWorld,
      default: () => defaultValue,
    });
  },
  4: function (module, exports, require) {
    const __BUNDLER__3 = require(3);

    const __BUNDLER__3_DEFAULT = require.__getDefaultExports(__BUNDLER__3);

    const __BUNDLER__1 = require(1);

    const __BUNDLER__1_DEFAULT = require.__getDefaultExports(__BUNDLER__1);

    console.log("---- default.js ----");
    console.log(__BUNDLER__3_DEFAULT.d);
    console.log(__BUNDLER__1_DEFAULT.d.default);
    console.log("---- default.js ----");
  },
  5: function (module, exports, require) {
    const __BUNDLER__1 = require(1);

    const __BUNDLER__1_DEFAULT = require.__getDefaultExports(__BUNDLER__1);

    const __BUNDLER__3 = require(3);

    const __BUNDLER__3_DEFAULT = require.__getDefaultExports(__BUNDLER__3);

    require(4);

    __BUNDLER__1.say(__BUNDLER__1.helloWorld);

    __BUNDLER__3.say(__BUNDLER__3.helloWorld);

    console.log(__BUNDLER__1_DEFAULT.d.default);
    console.log(__BUNDLER__3_DEFAULT.d);
  },
});
