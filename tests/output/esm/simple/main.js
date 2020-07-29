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

  return require(1);
})({
  0: function (module, exports, require) {
    require.__addEsmFlag(exports);

    function add(n) {
      return 10 + n;
    }

    require.__defineExports(exports, {
      add: () => add,
    });
  },
  1: function (module, exports, require) {
    const __BUNDLER__0 = require(0);

    console.log(__BUNDLER__0["add"](10));
  },
});
