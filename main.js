// Wind SMP Shop – main.js
const DISCORD_LINK = "https://discord.gg/NheD55yTAr";

// === Theme handling ===
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// === Wire up Discord links ===
function setDiscord(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = DISCORD_LINK;
  el.target = "_blank";
  el.rel = "noopener noreferrer";
}
setDiscord("nav-discord");
setDiscord("ticket-btn");
setDiscord("success-discord");
document.querySelectorAll(".footer-discord").forEach(a => {
  a.href = DISCORD_LINK;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
});

// === Render product grid ===
const grid = document.getElementById("product-grid");

function stockBadge(stock) {
  if (stock <= 0) return `<span class="stock out">Out of stock</span>`;
  if (stock <= 5) return `<span class="stock low">Only ${stock} left</span>`;
  return `<span class="stock in">In stock</span>`;
}

function renderProducts() {
  if (!grid) return;
  grid.innerHTML = "";
  
  // Cache-Buster, damit GitHub und Browser die Bilder nicht blockieren
  const cacheBuster = `?v=${Date.now()}`;

  products.filter(p => p.enabled).forEach(p => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <div class="product-image">
        <img src="${p.image}${cacheBuster}" alt="${p.name}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'📦'}))"/>
      </div>
      <div class="product-body">
        <div class="product-head">
          <div class="product-name">${p.name}</div>
          ${stockBadge(p.stock)}
        </div>
        <div class="product-desc">${p.description}</div>
        <div class="product-foot">
          <div class="price">€${p.price.toFixed(2)}</div>
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-primary buy-discord" ${p.stock <= 0 ? "disabled" : ""} data-id="${p.id}">Buy on Discord</button>
            <button class="btn add-cart" ${p.stock <= 0 ? "disabled" : ""} data-id="${p.id}">Add to cart</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}
renderProducts();

// === Modal (kept hidden – ordering happens entirely via Discord) ===
const modal = document.getElementById("modal");
if (modal) {
  modal.hidden = true;
  modal.remove();
}

// === Fake Orders widget ===
const ordersList = document.getElementById('orders-list');
function getAvailableProducts() {
  return products.filter(p => p.enabled && p.stock > 0 && !/elytra/i.test(p.name));
}
const fakeUsers = ['paul2012','lena42','gamer_max','alex_playz','nina_plays','samuel','viktor'];
function randomPick(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function formatTimeAgo(minutes) {
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const h = Math.floor(minutes/60);
  return `${h}h ago`;
}
function generateFakeOrders(count=6) {
  const avail = getAvailableProducts();
  if (!avail.length) return [];
  const orders = [];
  for (let i=0;i<count;i++) {
    const user = randomPick(fakeUsers);
    const item = randomPick(avail);
    const qty = Math.random() < 0.6 ? 1 : (Math.floor(Math.random()*5)+1);
    const minutes = Math.floor(Math.random()*180);
    orders.push({ user, item, qty, minutes });
  }
  return orders;
}
function renderFakeOrders() {
  if (!ordersList) return;
  const orders = generateFakeOrders(7);
  ordersList.innerHTML = '';
  orders.forEach(o => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="avatar">${o.user.charAt(0).toUpperCase()}</div>
      <div class="order-info">
        <div class="order-user">${o.user} <span class="small muted">· ${formatTimeAgo(o.minutes)}</span></div>
        <div class="order-item">${o.qty}× ${o.item.name}</div>
      </div>
    `;
    ordersList.appendChild(li);
  });
}
renderFakeOrders();
// Refresh periodically to feel live
setInterval(renderFakeOrders, 25000);

// Quick cart placeholder: show simple pulse when clicked
const cartBtn = document.getElementById('cart-btn');
if (cartBtn) {
  cartBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    cartBtn.animate([{ transform: 'scale(1)' },{ transform: 'scale(1.08)' },{ transform: 'scale(1)'}],{ duration: 250 });
  });
}

// === Cart functionality ===
const CART_KEY = 'wind_shop_cart_v1';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '{}');

function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function cartCount() { return Object.values(cart).reduce((s,n)=>s+n,0); }
function cartTotal() {
  let total = 0;
  for (const id in cart) {
    const p = products.find(x=>x.id==id);
    if (p) total += p.price * cart[id];
  }
  return total;
}

function addToCart(id, qty=1) {
  const pid = String(id);
  const p = products.find(x=>x.id==id);
  if (!p || p.stock<=0) return;
  cart[pid] = Math.min((cart[pid]||0) + qty, p.stock);
  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const pid = String(id);
  if (!cart[pid]) return;
  cart[pid] = Math.max(0, cart[pid] + delta);
  if (cart[pid] === 0) delete cart[pid];
  saveCart(); renderCart();
}

function clearCart() { cart = {}; saveCart(); renderCart(); }

// Render cart modal and count
const cartModal = document.getElementById('cart-modal');
const cartItemsEl = document.getElementById('cart-items');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');

function updateCartBadge() {
  if (!cartBtn) return;
  const c = cartCount();
  cartBtn.setAttribute('aria-label', `Cart (${c})`);
}

function renderCart() {
  updateCartBadge();
  if (!cartItemsEl) return;
  const keys = Object.keys(cart);
  if (!keys.length) {
    cartItemsEl.textContent = 'Your cart is empty.'; cartCountEl.textContent=''; cartTotalEl.textContent='€0.00'; return;
  }
  cartItemsEl.innerHTML = '';
  keys.forEach(id=>{
    const qty = cart[id];
    const p = products.find(x=>String(x.id)===id);
    if (!p) return;
    const row = document.createElement('div'); row.className='cart-row';
    row.innerHTML = `
      <div class="name">${p.name}</div>
      <div class="qty">
        <button class="btn" data-action="dec" data-id="${id}">−</button>
        <div class="small">${qty}</div>
        <button class="btn" data-action="inc" data-id="${id}">+</button>
        <button class="btn" data-action="rem" data-id="${id}">Remove</button>
      </div>
    `;
    cartItemsEl.appendChild(row);
  });
  cartCountEl.textContent = `${cartCount()} items`;
  cartTotalEl.textContent = `€${cartTotal().toFixed(2)}`;
}

// Show/hide cart
if (cartBtn) {
  cartBtn.addEventListener('click', (e)=>{ e.preventDefault(); if (!cartModal) return; cartModal.hidden = false; cartModal.setAttribute('aria-hidden','false'); renderCart(); });
}
const cartClose = document.getElementById('cart-close');
if (cartClose) cartClose.addEventListener('click', ()=>{ if (!cartModal) return; cartModal.hidden = true; cartModal.setAttribute('aria-hidden','true'); });

// Handle add-to-cart and cart button clicks using delegation
if (grid) {
  grid.addEventListener('click', (e)=>{
    const add = e.target.closest('.add-cart');
    const buy = e.target.closest('.buy-discord');
    if (add) { const id = Number(add.dataset.id); addToCart(id); add.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:200}); }
    if (buy) { const id = Number(buy.dataset.id); addToCart(id); window.open(DISCORD_LINK,'_blank'); }
  });
}

// Cart item controls
if (cartItemsEl) {
  cartItemsEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); if (!btn) return;
    const action = btn.dataset.action; const id = Number(btn.dataset.id);
    if (action==='inc') changeQty(id,1);
    if (action==='dec') changeQty(id,-1);
    if (action==='rem') { delete cart[String(id)]; saveCart(); renderCart(); }
  });
}

// Clear cart and checkout
const clearBtn = document.getElementById('clear-cart');
if (clearBtn) clearBtn.addEventListener('click', ()=>{ clearCart(); });

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) checkoutBtn.addEventListener('click', async ()=>{
  const keys = Object.keys(cart); if (!keys.length) { alert('Your cart is empty.'); return; }
  let text = 'Order from Wind Market:\n';
  keys.forEach(id=>{ const p = products.find(x=>String(x.id)===id); if (p) text += `${cart[id]}x ${p.name} — €${(p.price*cart[id]).toFixed(2)}\n`; });
  text += `Total: €${cartTotal().toFixed(2)}`;
  // copy to clipboard if available
  try { await navigator.clipboard.writeText(text); } catch(e) { /* ignore */ }
  // open discord and inform user to paste the message in ticket
  window.open(DISCORD_LINK,'_blank');
  alert('Order summary copied to clipboard. Paste it into the Discord ticket to complete the order.');
});

// initialize
renderCart();
