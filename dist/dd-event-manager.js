(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod);
    global.DDEventManager = mod.exports;
  }
})(this, function (module) {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var DDEventManager = function () {

    /**
     * constructor
     */
    function DDEventManager(context) {
      var _this = this;

      var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          onBeforeAddListener = _ref.onBeforeAddListener,
          onBeforeRemoveListener = _ref.onBeforeRemoveListener;

      _classCallCheck(this, DDEventManager);

      this.context = context;
      this._stacks = [];
      this._history = {};

      this.onBeforeAddListener = onBeforeAddListener;
      this.onBeforeRemoveListener = onBeforeRemoveListener;

      var on = function on(typeDefine, listener) {
        _this.addListener(typeDefine, listener);
      };

      var one = function one(typeDefine, listener) {
        _this.addListener(typeDefine, listener, true);
      };

      var has = function has(type, listener) {
        if (_this.has(type)) {
          if (listener) {
            listener();
          }
          return true;
        }
        return false;
      };

      var hasAndOn = function hasAndOn(typeDefine, listener) {
        var type = typeDefineSplitter(typeDefine).type;
        var isHas = has(type, listener);
        on(typeDefine, listener);
        return isHas;
      };

      var hasAndOne = function hasAndOne(typeDefine, listener) {
        var type = typeDefineSplitter(typeDefine).type;
        if (!has(type, listener)) {
          one(typeDefine, listener);
          return false;
        }
        return true;
      };

      var off = function off(typeDefine, listener) {
        _this.off(typeDefine, listener);
      };

      var emit = function emit(typeDefine, params) {
        _this.emit(typeDefine, params);
      };

      this.context.on = on;
      this.context.one = one;
      this.context.has = has;
      this.context.hasAndOn = hasAndOn;
      this.context.hasAndOne = hasAndOne;
      this.context.off = off;
      this.context.emit = emit;
    }

    /**
     * 全クリア
     */


    DDEventManager.prototype.destroy = function destroy() {
      this._stacks.forEach(function (stack) {
        stack.remove();
      });

      this._history = {};
    };

    DDEventManager.prototype.find = function find(typeDefine, listener) {
      return this._stacks.filter(function (stack) {
        return stack.match(typeDefine, listener);
      });
    };

    DDEventManager.prototype.has = function has(type) {
      return this._history[type] !== undefined;
    };

    DDEventManager.prototype.off = function off(typeDefine, listener) {
      var stacks = this.find(typeDefine, listener);
      stacks.forEach(function (stack) {
        stack.remove();
      });
    };

    DDEventManager.prototype.emit = function emit(typeDefine, params) {
      var type = typeDefineSplitter(typeDefine).type;
      var stacks = this.find(typeDefine);

      stacks.forEach(function (stack) {
        stack.trigger(params);
      });

      this._history[type] = true;
    };

    DDEventManager.prototype.addListener = function addListener(typeDefine, listener, once) {
      var stack = new DDEventManagerStack(this, typeDefine, listener, once);
      this.onBeforeAddListener && this.onBeforeAddListener(stack);
      this._stacks.push(stack);
    };

    return DDEventManager;
  }();

  var DDEventManagerStack = function () {

    /**
     * constructor
     */
    function DDEventManagerStack(context, typeDefine, listener) {
      var once = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

      _classCallCheck(this, DDEventManagerStack);

      typeDefine = typeDefineSplitter(typeDefine);

      this.context = context;
      this.type = typeDefine.type;
      this.tag = typeDefine.tag;
      this.listener = listener;
      this.once = once;
    }

    /**
     * コンテキストから除去
     */


    DDEventManagerStack.prototype.remove = function remove() {
      this.context.onBeforeRemoveListener && this.context.onBeforeRemoveListener(this);
      this.context._stacks.splice(this.context._stacks.indexOf(this), 1);
    };

    DDEventManagerStack.prototype.match = function match(typeDefine, listener) {
      if (listener && listener !== this.listener) return false;

      typeDefine = typeDefineSplitter(typeDefine);

      var type = typeDefine.type;
      var tag = typeDefine.tag;

      if (type && type !== '' && this.type !== type) {
        return false;
      }

      if (tag && this.tag !== tag) {
        return false;
      }

      return true;
    };

    DDEventManagerStack.prototype.trigger = function trigger(params) {
      this.listener(params);
      if (this.once) {
        this.remove();
      }
    };

    return DDEventManagerStack;
  }();

  function typeDefineSplitter(typeDefine) {
    var tmp = typeDefine.split('.');
    return { type: tmp[0], tag: tmp[1] };
  }

  module.exports = DDEventManager;
});
