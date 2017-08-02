class DDEventManager {



  /**
   * constructor
   */
  constructor(context) {
    this.context  = context;
    this._stacks  = [];
    this._history = {};

    const on = (typeDefine, listener) => {
      this.addListener(typeDefine, listener);
    }

    const one = (typeDefine, listener) => {
      this.addListener(typeDefine, listener, true);
    }

    const has = (type, listener) => {
      if (this.has(type)) {
        if (listener) {
          listener();
        }
        return true;
      }
      return false;
    }

    const hasAndOn = (typeDefine, listener) => {
      let type = typeDefineSplitter(typeDefine).type;
      const isHas = has(type, listener);
      on(typeDefine, listener);
      return isHas;
    }

    const hasAndOne = (typeDefine, listener) => {
      let type = typeDefineSplitter(typeDefine).type;
      if (!has(type, listener)) {
        one(typeDefine, listener);
        return false;
      }
      return true;
    }

    const off = (typeDefine, listener) => {
      this.off(typeDefine, listener);
    }

    const emit = (typeDefine, params) => {
      this.emit(typeDefine, params);
    }

    this.context.on        = on;
    this.context.one       = one;
    this.context.has       = has;
    this.context.hasAndOn  = hasAndOn;
    this.context.hasAndOne = hasAndOne;
    this.context.off       = off;
    this.context.emit      = emit;
  }



  /**
   * 全クリア
   */
  destroy() {
    this._stacks.forEach(stack => {
      stack.remove();
    });

    this._history = {};
  }



  /**
   * イベント名、タグ名での検索
   */
  find(typeDefine, listener) {
    return this._stacks.filter(stack => { return stack.match(typeDefine, listener) });
  }



  /**
   * すでにイベントが発火済みか
   */
  has(type) {
    return this._history[type] !== undefined;
  }



  /**
   * リスナー解除
   */
  off(typeDefine, listener) {
    let stacks = this.find(typeDefine, listener);
    stacks.forEach(stack => {
      stack.remove();
    });
  }



  /**
   * イベント通知
   */
  emit(typeDefine, params) {
    let type = typeDefineSplitter(typeDefine).type;
    let stacks = this.find(typeDefine);

    stacks.forEach(stack => {
      stack.trigger(params);
    });

    this._history[type] = true;
  }



  /**
   * リスナー登録
   */
  addListener(typeDefine, listener, once) {
    let stack = new DDEventManagerStack(this, typeDefine, listener, once);
    this._stacks.push(stack);
  }
}



class DDEventManagerStack {



  /**
   * constructor
   */
  constructor(context, typeDefine, listener, once = false) {
    typeDefine = typeDefineSplitter(typeDefine);

    this.context  = context;
    this.type     = typeDefine.type;
    this.tag      = typeDefine.tag;
    this.listener = listener;
    this.once     = once;
  }



  /**
   * コンテキストから除去
   */
  remove() {
    this.context._stacks.splice(this.context._stacks.indexOf(this), 1);
  }



  /**
   * イベント名、タグ名にマッチするかチェック
   */
  match(typeDefine, listener) {
    if (listener && listener !== this.listener) return false;

    typeDefine = typeDefineSplitter(typeDefine);

    let type   = typeDefine.type,
        tag    = typeDefine.tag;

    if (type && type !== '' && this.type !== type) {
      return false;
    }

    if (tag && this.tag !== tag) {
      return false;
    }

    return true;
  }



  /**
   * リスナーをトリガーする
   */
  trigger(params) {
    this.listener(params);
    if (this.once) {
      this.remove();
    }
  }
}



function typeDefineSplitter(typeDefine) {
  let tmp = typeDefine.split('.');
  return {type: tmp[0], tag: tmp[1]};
}



module.exports = DDEventManager;