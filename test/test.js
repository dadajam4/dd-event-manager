const assert = require('assert');
const DDEventManager = require('../lib/DDEventManager');



describe('basic', function() {

  describe('on(/)', function() {
    it('リスナを1つ登録した時、スタック件数が1つになる', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);

      obj.on('test', function() {});

      assert.equal(ev._stacks.length, 1);
    });

    it('リスナを2つ登録した時、スタック件数が2つになる', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);

      obj.on('test1', function() {});
      obj.on('test2', function() {});

      assert.equal(ev._stacks.length, 2);
    });

    it('タグをつけて登録した時、スタック情報にタグが付与されている', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);

      obj.on('test1', function() {});
      obj.on('test2.tag', function() {});

      assert.equal(ev._stacks[1].type + ev._stacks[1].tag, 'test2tag');
    });
  });

  describe('off(/)', function() {
    it('リスナを解除した時、スタック配列から消えている', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);

      obj.on('test', function() {});
      obj.off('test');

      assert.equal(ev._stacks.length, 0);
    });

    it('functionでのマッチングができる', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      const cb  = function() {}
      obj.on('test', cb);
      obj.off('test', cb);

      assert.equal(ev._stacks.length, 0);
    });

    it('functionでのマッチングが不一致であれば解除しない', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      const cb  = function() {}
      const cb2 = function() {}
      obj.on('test', cb);
      obj.off('test', cb2);

      assert.equal(ev._stacks.length, 1);
    });

    it('タグでのマッチングが不一致であれば解除しない', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      const cb  = function() {}
      obj.on('test', cb);
      obj.on('test.tag1', cb);
      obj.on('test2.tag1', cb);
      obj.off('.tag1');

      assert.equal(ev._stacks.length, 1);
    });

    it('タグ、functionの複合マッチング1', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      const cb  = function() {}
      obj.on('test', cb);
      obj.on('test.tag1', cb);
      obj.on('test2.tag1', cb);
      obj.off('.tag1', cb);

      assert.equal(ev._stacks.length, 1);
    });

    it('タグ、functionの複合マッチング2', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      const cb  = function() {}
      const cb2 = function() {}
      obj.on('test', cb);
      obj.on('test.tag1', cb2);
      obj.on('test2.tag1', cb);
      obj.off('.tag1', cb);

      assert.equal(ev._stacks.length, 2);
    });
  });

  describe('one(/)', function() {
    it('emit後にスタックから削除される - 1', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);

      obj.one('test', function() {});
      obj.emit('test');

      assert.equal(ev._stacks.length, 0);
    });

    it('emit後にスタックから削除される - 2', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);

      obj.one('test', function() {});
      obj.one('test', function() {});
      obj.one('test2', function() {});
      obj.one('test', function() {});
      obj.one('test3', function() {});
      obj.emit('test');

      const result = (ev._stacks.length === 2 && ev._stacks[0].type === 'test2' && ev._stacks[1].type === 'test3');
      assert.equal(result, true);
    });
  });

  describe('has(/)', function() {
    it('履歴になかった時はfalseを返してコールバックを実行しない', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      let callbackResult = 0;

      obj.emit('other');
      const result = obj.has('test', function() {
        callbackResult++;
      }) === false;

      assert.equal((result && callbackResult === 0), true);
    });

    it('履歴になかった時はtrueを返してコールバックを実行する', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      let callbackResult = 0;

      obj.emit('test');
      const result = obj.has('test', function() {
        callbackResult++;
      }) === true;

      assert.equal((result && callbackResult === 1), true);
    });
  });

  describe('hasAndOn(/)', function() {
    it('持ってなかったけどあとでemitされた時はfalseを返却してコールバックは1回', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      let callbackResult = 0;

      obj.emit('other');
      let result = obj.hasAndOn('test', () => {
        callbackResult++;
      }) === false;
      if (result) {
        obj.emit('test');
        if (callbackResult !== 1) result = false;
      }

      assert.equal(result, true);
    });

    it('登録時にすでにemit履歴があればtrueを返却してコールバックは2回', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      let callbackResult = 0;

      obj.emit('test');
      let result = obj.hasAndOn('test', () => {
        callbackResult++;
      }) === true;
      if (result) {
        obj.emit('test');
        if (callbackResult !== 2) result = false;
      }

      assert.equal(result, true);
    });
  });

  describe('hasAndOne(/)', function() {
    it('持ってなかったけどあとでemitされた時はfalseを返却して、後にemitでスタックから消える', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      let callbackResult = 0;

      obj.emit('other');
      let result = obj.hasAndOne('test', () => {
        callbackResult++;
      }) === false;
      if (result) {
        obj.emit('test');
        if (callbackResult !== 1) result = false;
        if (ev._stacks.length !== 0) result = false;
      }

      assert.equal(result, true);
    });

    it('登録時にすでにemit履歴があればtrueを返却してスタック登録は行わない', function() {
      const obj = {};
      const ev  = new DDEventManager(obj);
      let callbackResult = 0;

      obj.emit('test');
      let result = obj.hasAndOne('test', () => {
        callbackResult++;
      }) === true;
      if (ev._stacks.length !== 0) result = false;
      if (result) {
        obj.emit('test');
        if (callbackResult !== 1) result = false;
      }

      assert.equal(result, true);
    });
  });
});