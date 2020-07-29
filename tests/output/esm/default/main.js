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

    const __default__ = () => {
      console.log("hi");
    };

    require.__defineExports(exports, {
      default: () => __default__,
    });
  },
  1: function (module, exports, require) {
    require.__addEsmFlag(exports);

    const __BUNDLER__0 = require(0);

    const __BUNDLER__0_DEFAULT = require.__getDefaultExports(__BUNDLER__0);

    __BUNDLER__0_DEFAULT.d();
  },
});
