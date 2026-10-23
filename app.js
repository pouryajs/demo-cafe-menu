"use strict";
const $ = (s) => document.querySelector(s),
  fa = (n) => Number(n).toLocaleString("fa-IR"),
  money = (n) => `${fa(n)} <small>تومان</small>`,
  esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const params = new URLSearchParams(location.search),
  kitchen = params.get("view") === "kitchen";
let state,
  category = "همه",
  cart = {},
  table = Number(params.get("table")) || 7,
  note = "",
  busy = false;
if (table < 1 || table > 50 || !Number.isInteger(table)) table = 7;
let ownOrders = [];
try {
  ownOrders = JSON.parse(sessionStorage.getItem("maks-orders") || "[]");
  if (!Array.isArray(ownOrders)) ownOrders = [];
} catch {}
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("show"), 4500);
}
function art(type) {
  const cake = type === "cake",
    croissant = type === "croissant",
    glass = ["iced", "matcha", "tea"].includes(type);
  return `<svg viewBox="0 0 300 190" aria-hidden="true"><ellipse cx="150" cy="158" rx="86" ry="14" fill="#38291d" opacity=".09"/>${cake ? '<path d="M90 85L186 60 219 129 96 144Z" fill="#503126"/><path d="M90 85L186 60 219 76 96 104Z" fill="#38231c"/><path d="M96 119L211 94 215 106 96 131Z" fill="#ad7960"/><path d="M143 69Q150 40 163 62" fill="none" stroke="#8d4e37" stroke-width="7"/>' : croissant ? '<path d="M69 121Q78 65 113 88Q148 48 181 86Q217 63 236 122L208 137 182 115Q150 139 116 112L91 139Z" fill="#c88b42"/><path d="M113 88L128 123M145 76L153 126M181 86L176 120" stroke="#f3c77f" stroke-width="10" fill="none"/>' : glass ? `<path d="M111 54L122 153Q150 165 180 153L191 54Z" fill="${type === "matcha" ? "#91a374" : type === "tea" ? "#b67c39" : "#704a32"}"/><ellipse cx="151" cy="54" rx="40" ry="11" fill="${type === "matcha" ? "#ced4af" : "#b1855c"}"/><path d="M173 62L184 24" stroke="#445640" stroke-width="5"/><path d="M124 74L141 70 144 86 127 89M155 91L171 88 175 104 158 108" fill="white" opacity=".4"/>` : `<ellipse cx="147" cy="150" rx="68" ry="10" fill="#d4cec0"/><path d="M193 80Q237 74 222 112Q213 126 194 118" fill="none" stroke="#fdfaf2" stroke-width="12"/><path d="M94 79H199L189 131Q147 160 105 132Z" fill="#fdfaf2"/><ellipse cx="146" cy="79" rx="52" ry="17" fill="#a66b3e"/><ellipse cx="146" cy="79" rx="45" ry="13" fill="#${type === "espresso" ? "4b2e22" : "c58b5b"}"/>${type === "latte" ? '<path d="M146 87Q116 70 132 71Q143 69 146 77Q158 64 166 73Q171 79 146 87" fill="#f9e8c9"/>' : ""}<path d="M126 49Q115 36 128 23M154 47Q144 32 156 20" stroke="#ffffff" stroke-width="3" opacity=".65" fill="none"/>`}</svg>`;
}
function render() {
  try {
    state = Cafe.read();
  } catch (e) {
    $("#app").innerHTML =
      '<section class="empty"><h1>دسترسی به حافظه ممکن نیست</h1><p>حافظهٔ مرورگر را فعال کنید و صفحه را دوباره باز کنید.</p></section>';
    return;
  }
  $("#menuLink").classList.toggle("active", !kitchen);
  $("#kitchenLink").classList.toggle("active", kitchen);
  if (kitchen) return renderKitchen();
  const items = Cafe.menu.filter(
      (i) => category === "همه" || i.category === category,
    ),
    total = Object.entries(cart).reduce(
      (s, [id, q]) => s + Cafe.menu.find((i) => i.id === id).price * q,
      0,
    ),
    count = Object.values(cart).reduce((a, b) => a + b, 0);
  $("#app").innerHTML =
    `<section class="hero"><div><span class="eyebrow">یک فنجان، یک حال خوب</span><h1>اینجا، کمی <em>مکث</em> کن.</h1><p>عطر قهوهٔ تازه، طعم لحظه‌های ساده.<br>انتخاب کن؛ ما به میزت می‌آوریم.</p><span class="hero-label">هر روز از ۸ صبح تا ۱۱ شب</span></div><div class="hero-art">${art("latte")}<span class="round-label">تازه‌دم<br>با عشق</span></div></section><div class="layout"><section><div class="section-heading"><div><span class="eyebrow">چیزی که حالتو خوب می‌کنه</span><h2>منوی مکث</h2></div><span class="subtle">${fa(Cafe.menu.length)} انتخاب خوش‌طعم</span></div><div class="categories" role="group" aria-label="دسته‌بندی منو">${["همه", "قهوه", "نوشیدنی سرد", "چای و دمنوش", "کیک و شیرینی"].map((c) => `<button data-category="${c}" class="${category === c ? "selected" : ""}" aria-pressed="${category === c}">${c}</button>`).join("")}</div><div class="menu-grid">${items.map((i) => `<article class="food-card ${state.stock[i.id] === 0 ? "soldout" : ""}"><div class="food-art art-${i.art}">${art(i.art)}${i.tag ? `<span class="tag">${i.tag}</span>` : ""}${state.stock[i.id] === 0 ? '<span class="sold-label">تمام شد</span>' : ""}</div><div class="food-body"><h3>${i.name}</h3><p>${i.description}</p><div class="food-bottom"><strong>${money(i.price)}</strong><button class="add" data-add="${i.id}" aria-label="افزودن ${i.name}" ${state.stock[i.id] <= (cart[i.id] || 0) ? "disabled" : ""}>+</button></div><small class="stock">${state.stock[i.id] ? `${fa(state.stock[i.id])} عدد موجود` : "فعلاً ناموجود"}</small></div></article>`).join("")}</div></section><aside id="basket" class="basket"><div class="basket-title"><h2>سفارش شما</h2><span>${fa(count)} مورد</span></div><label class="table-label" for="table">برای میز شماره</label><select id="table">${Array.from({ length: 50 }, (_, i) => `<option value="${i + 1}" ${table === i + 1 ? "selected" : ""}>میز ${fa(i + 1)}</option>`).join("")}</select>${
      count
        ? `<div class="cart-list">${Object.entries(cart)
            .map(([id, q]) => {
              const i = Cafe.menu.find((i) => i.id === id);
              return `<div class="cart-row"><div><h3>${i.name}</h3><span>${money(i.price * q)}</span>${q > state.stock[id] ? '<small class="error">موجودی کافی نیست؛ تعداد را کم کنید.</small>' : ""}</div><div class="quantity"><button data-minus="${id}" aria-label="کم کردن ${i.name}">−</button><span>${fa(q)}</span><button data-add="${id}" aria-label="بیشتر کردن ${i.name}" ${q >= state.stock[id] ? "disabled" : ""}>+</button></div></div>`;
            })
            .join(
              "",
            )}</div><label class="note-label" for="note">توضیح سفارش <span>(اختیاری)</span></label><textarea id="note" maxlength="300" placeholder="مثلاً بدون شکر، شیر کم‌چرب…">${esc(note)}</textarea>`
        : '<div class="empty-cart"><span>☕</span><h3>جای یک حال خوب خالی‌ست</h3><p>از منو چیزی انتخاب کن.</p></div>'
    }<div class="total"><span>جمع سفارش</span><strong>${money(total)}</strong></div><button id="submit" class="primary" ${!count || busy ? "disabled" : ""}>${busy ? "در حال ثبت…" : "ثبت سفارش"} <span>←</span></button><p class="basket-foot">پرداخت در کافه · سرو در میز شما</p><div id="myOrders">${state.orders
      .filter((o) => ownOrders.includes(o.id))
      .slice()
      .reverse()
      .map(
        (o) =>
          `<div class="receipt"><strong>میز ${fa(o.table)} · سفارش ${esc(o.id.slice(0, 6))}</strong><p>${o.status === "ready" ? "سفارش شما آماده شد؛ نوش جان!" : "سفارش ثبت شد و در حال آماده‌سازی است."}</p></div>`,
      )
      .join(
        "",
      )}</div></aside></div><a class="mobile-basket" href="#basket">${fa(count)} مورد در سبد <strong>${money(total)}</strong><span>مشاهده ↓</span></a>`;
  $('[id="table"]').onchange = (e) => {
    table = Number(e.target.value);
    const u = new URL(location);
    u.searchParams.set("table", table);
    history.replaceState(null, "", u);
  };
  if ($("#note")) $("#note").oninput = (e) => (note = e.target.value);
  document.querySelectorAll("[data-category]").forEach(
    (b) =>
      (b.onclick = () => {
        category = b.dataset.category;
        render();
      }),
  );
  document.querySelectorAll("[data-add]").forEach(
    (b) =>
      (b.onclick = () => {
        const id = b.dataset.add;
        state = Cafe.read();
        if ((cart[id] || 0) >= state.stock[id])
          return toast("این آیتم موجودی بیشتری ندارد.");
        cart[id] = (cart[id] || 0) + 1;
        render();
      }),
  );
  document.querySelectorAll("[data-minus]").forEach(
    (b) =>
      (b.onclick = () => {
        if (--cart[b.dataset.minus] <= 0) delete cart[b.dataset.minus];
        render();
      }),
  );
  $("#submit").onclick = async () => {
    if (busy) return;
    busy = true;
    render();
    let order;
    try {
      await Cafe.mutate((s) => {
        order = Cafe.submit(s, cart, table, note);
      });
      ownOrders.push(order.id);
      try {
        sessionStorage.setItem("maks-orders", JSON.stringify(ownOrders));
      } catch {}
      cart = {};
      note = "";
      toast("سفارش شما با موفقیت به آشپزخانه رسید.");
    } catch (e) {
      toast(e.message);
    } finally {
      busy = false;
      render();
    }
  };
}
function renderKitchen() {
  const pending = state.orders.filter((o) => o.status === "pending");
  $("#app").innerHTML =
    `<section class="kitchen-head"><div><span class="eyebrow">پشت صحنهٔ یک حال خوب</span><h1>آشپزخانهٔ مکث</h1><p>سفارش‌ها و موجودی، هم‌زمان با منوی مشتری</p></div><span class="live"><i></i> به‌روزرسانی زنده</span></section><div class="stats"><div><strong>${fa(pending.length)}</strong><span>در انتظار آماده‌سازی</span></div><div><strong>${fa(state.orders.filter((o) => o.status === "ready").length)}</strong><span>سفارش آماده</span></div><div><strong>${fa(Cafe.menu.filter((i) => !state.stock[i.id]).length)}</strong><span>آیتم ناموجود</span></div></div><div class="kitchen-layout"><section><h2>سفارش‌های رسیده</h2><div class="orders">${
      state.orders.length
        ? state.orders
            .slice()
            .reverse()
            .map(
              (o) =>
                `<article class="order-card"><header><h3>میز ${fa(o.table)}</h3><span class="status ${o.status}">${o.status === "ready" ? "آماده شد" : "در حال آماده‌سازی"}</span></header><small>${new Date(o.createdAt).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })} · ${esc(o.id.slice(0, 6))}</small><ul>${o.items.map((i) => `<li><span>${fa(i.quantity)} × ${esc(i.name)}</span><strong>${money(i.price * i.quantity)}</strong></li>`).join("")}</ul>${o.note ? `<p class="order-note">توضیح: ${esc(o.note)}</p>` : ""}<div class="order-total">جمع <strong>${money(o.total)}</strong></div>${o.status === "pending" ? `<button class="primary" data-ready="${o.id}">آماده شد ✓</button>` : '<p class="ready-text">آمادهٔ سرو در میز</p>'}</article>`,
            )
            .join("")
        : '<div class="empty"><h3>هنوز سفارشی نرسیده</h3><p>اولین سفارش مشتری همین‌جا نمایش داده می‌شود.</p></div>'
    }</div></section><aside class="inventory"><h2>موجودی منو</h2><p class="subtle">تغییرات بلافاصله در منوی مشتری اعمال می‌شود.</p>${Cafe.menu.map((i) => `<div class="inventory-row"><h3>${i.name}<small>${state.stock[i.id] ? `${fa(state.stock[i.id])} عدد موجود` : "تمام شد"}</small></h3><div class="inventory-controls"><label class="sr-only" for="stock-${i.id}">موجودی ${i.name}</label><input id="stock-${i.id}" type="number" min="0" max="999" step="1" value="${state.stock[i.id]}" data-stock="${i.id}"><button data-save="${i.id}">ذخیره</button><button data-out="${i.id}" ${!state.stock[i.id] ? "disabled" : ""}>ناموجود</button></div></div>`).join("")}</aside></div>`;
  document.querySelectorAll("[data-ready]").forEach(
    (b) =>
      (b.onclick = async () => {
        try {
          await Cafe.mutate((s) => {
            const o = s.orders.find((o) => o.id === b.dataset.ready);
            if (o) o.status = "ready";
          });
          render();
          toast("سفارش آمادهٔ سرو است.");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
  document.querySelectorAll("[data-out],[data-save]").forEach(
    (b) =>
      (b.onclick = async () => {
        const id = b.dataset.out || b.dataset.save,
          input = $(`#stock-${id}`),
          value = b.dataset.out ? 0 : Number(input.value);
        if (
          input.value === "" ||
          !Number.isInteger(value) ||
          value < 0 ||
          value > 999
        )
          return toast("موجودی باید عدد صحیح بین ۰ تا ۹۹۹ باشد.");
        try {
          await Cafe.mutate((s) => (s.stock[id] = value));
          render();
          toast("موجودی منو به‌روز شد.");
        } catch (e) {
          toast(e.message);
        }
      }),
  );
}
window.addEventListener("storage", (e) => {
  if (e.key === Cafe.KEY || e.key === null) render();
});
render();
