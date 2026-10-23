(function (root) {
  "use strict";
  const KEY = "maks-cafe-v1";
  const menu = [
    {
      id: "espresso",
      name: "اسپرسو",
      category: "قهوه",
      price: 85000,
      description: "یک شات قهوهٔ تخصصی؛ غلیظ، گرم و خوش‌عطر",
      stock: 12,
      art: "espresso",
    },
    {
      id: "latte",
      name: "کافه لاته",
      category: "قهوه",
      price: 125000,
      description: "اسپرسوی دبل، شیر بخارداده و یک قلب کوچک",
      stock: 8,
      art: "latte",
      tag: "محبوب مکث",
    },
    {
      id: "cappuccino",
      name: "کاپوچینو",
      category: "قهوه",
      price: 115000,
      description: "تعادل دوست‌داشتنی اسپرسو، شیر و فوم نرم",
      stock: 6,
      art: "latte",
    },
    {
      id: "iced",
      name: "آیس آمریکانو",
      category: "نوشیدنی سرد",
      price: 105000,
      description: "اسپرسوی دبل روی یخ؛ ساده و سرحال‌کننده",
      stock: 7,
      art: "iced",
    },
    {
      id: "matcha",
      name: "ماچا لاته",
      category: "نوشیدنی سرد",
      price: 155000,
      description: "ماچای ژاپنی، شیر سرد و لطافت وانیل",
      stock: 0,
      art: "matcha",
    },
    {
      id: "tea",
      name: "دمنوش آرامش",
      category: "چای و دمنوش",
      price: 95000,
      description: "ترکیب به‌لیمو و گل‌محمدی، برای یک مکث آرام",
      stock: 9,
      art: "tea",
    },
    {
      id: "cake",
      name: "کیک شکلاتی",
      category: "کیک و شیرینی",
      price: 145000,
      description: "کیک شکلات تلخ با بافت مرطوب و گاناش",
      stock: 4,
      art: "cake",
      tag: "پخت امروز",
    },
    {
      id: "croissant",
      name: "کروسان کره‌ای",
      category: "کیک و شیرینی",
      price: 110000,
      description: "لایه‌لایه، طلایی و تازه از فر درآمده",
      stock: 5,
      art: "croissant",
    },
  ];
  function initial() {
    return {
      version: 1,
      stock: Object.fromEntries(menu.map((i) => [i.id, i.stock])),
      orders: [],
    };
  }
  function read() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial();
    const s = JSON.parse(raw);
    if (
      s.version !== 1 ||
      !s.stock ||
      !Array.isArray(s.orders) ||
      menu.some((i) => !Number.isInteger(s.stock[i.id]) || s.stock[i.id] < 0)
    )
      throw Error("داده‌های ذخیره‌شده معتبر نیستند.");
    return s;
  }
  function write(s) {
    localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  }
  async function mutate(fn) {
    const action = () => {
      const state = read();
      fn(state);
      return write(state);
    };
    return navigator.locks ? navigator.locks.request(KEY, action) : action();
  }
  function submit(state, cart, table, note) {
    if (!Number.isInteger(table) || table < 1 || table > 50)
      throw Error("شمارهٔ میز باید بین ۱ تا ۵۰ باشد.");
    const items = Object.entries(cart)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => {
        const item = menu.find((i) => i.id === id);
        if (!item || !Number.isInteger(quantity) || quantity > state.stock[id])
          throw Error("موجودی تغییر کرده؛ سبد را بررسی کنید.");
        return { id, name: item.name, price: item.price, quantity };
      });
    if (!items.length) throw Error("ابتدا چیزی به سبد اضافه کنید.");
    const order = {
      id: crypto.randomUUID(),
      table,
      note: String(note || "").slice(0, 300),
      items,
      total: items.reduce((t, i) => t + i.price * i.quantity, 0),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    items.forEach((i) => (state.stock[i.id] -= i.quantity));
    state.orders.push(order);
    return order;
  }
  root.Cafe = { KEY, menu, initial, read, mutate, submit };
})(globalThis);
