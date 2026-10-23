const assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
const memory = new Map();
let queue = Promise.resolve();
const ctx = {
  localStorage: {
    getItem: (k) => memory.get(k) || null,
    setItem: (k, v) => memory.set(k, v),
  },
  crypto: require("node:crypto").webcrypto,
  navigator: {
    locks: {
      request: (key, fn) => {
        const result = queue.then(fn);
        queue = result.catch(() => {});
        return result;
      },
    },
  },
};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + "/store.js", "utf8"), ctx);
const C = ctx.Cafe;
(async () => {
  let s = C.initial();
  assert.equal(s.stock.matcha, 0);
  assert.throws(() => C.submit(s, { matcha: 1 }, 7, ""));
  assert.equal(s.orders.length, 0);
  const order = C.submit(s, { latte: 2, cake: 1 }, 7, "بدون شکر");
  assert.equal(order.total, 395000);
  assert.equal(s.stock.latte, 6);
  assert.equal(s.stock.cake, 3);
  assert.equal(s.orders[0].table, 7);
  assert.throws(() => C.submit(s, { latte: 99 }, 7, ""));
  assert.equal(s.stock.latte, 6);
  assert.throws(() => C.submit(s, {}, 7, ""));
  assert.throws(() => C.submit(s, { latte: 1 }, 51, ""));
  assert.throws(() => C.submit(s, { latte: 1.5 }, 7, ""));
  await C.mutate((s) => (s.stock.espresso = 1));
  const results = await Promise.allSettled([
    C.mutate((s) => C.submit(s, { espresso: 1 }, 1, "")),
    C.mutate((s) => C.submit(s, { espresso: 1 }, 2, "")),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(C.read().stock.espresso, 0);
  assert.equal(C.read().orders.length, 1);
  await C.mutate((s) => (s.stock.latte = 0));
  assert.throws(() => C.submit(C.read(), { latte: 1 }, 7, ""));
  await C.mutate((s) => (s.orders[0].status = "ready"));
  assert.equal(C.read().orders[0].status, "ready");
  await C.mutate((s) => (s.stock.latte = 10));
  assert.equal(C.read().stock.latte, 10);
  console.log(
    "PASS: totals, table validation, empty cart, sold-out blocking, stale cart rejection, stock decrement, concurrent last-item orders, ready status, restock, persistence.",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
