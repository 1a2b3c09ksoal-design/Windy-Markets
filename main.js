// Wind SMP Shop – main.js (Premium Edition - FIXED)
const DISCORD_LINK = "https://discord.gg/NheD55yTAr";

// ============================================
// === MODAL MANAGER ===
// ============================================
const modals = {
  cart: document.getElementById('cart-modal'),
  checkout: document.getElementById('checkout-modal'),
  account: document.getElementById('account-modal')
};

function closeAllModals() {
  Object.values(modals).forEach(modal => {
    if (modal) {
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    }
  });
}

function openModal(modalName) {
  closeAllModals();
  if (modals[modalName]) {
    modals[modalName].hidden = false;
    modals[modalName].setAttribute('aria-hidden', 'false');
  }
}

// ============================================
// === THEME HANDLING ===
// ============================================
const themeToggle = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
});

// ============================================
// === DISCORD LINKS ===
// ============================================
function setDiscord(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.href = DISCORD_LINK;
  el.target = "_blank";
  el.rel = "noopener noreferrer";
}
setDiscord("nav-discord");
document.querySelectorAll(".footer-discord").forEach(a => {
  a.href = DISCORD_LINK;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
});

// ============================================
// === TICKET SYSTEM ===
// ============================================
const TICKETS_KEY = 'wind_shop_tickets_v1';
const ACCOUNT_KEY = 'wind_shop_account_v1';

function generateTicketID() {
  return 'WND-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

function createTicket(data) {
  const ticket = {
    id: generateTicketID(),
    username: data.username,
    email: data.email,
    discord: data.discord,
    items: data.items,
    total: data.total,
    notes: data.notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  let tickets = JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
  tickets.push(ticket);
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
  
  // Save account info
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({
    username: data.username,
    email: data.email,
    discord: data.discord,
  }));
  
  return ticket;
}

function getTickets() {
  return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
}

function getAccountInfo() {
  return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || null);
}

// Simulate ticket status updates
function simulateTicketUpdates() {
  const tickets = getTickets();
  const now = new Date();
  
  tickets.forEach(ticket => {
    const createdTime = new Date(ticket.createdAt);
    const diffMinutes = (now - createdTime) / (1000 * 60);
    
    if (diffMinutes > 30 && ticket.status === 'pending') {
      ticket.status = 'open';
      ticket.updatedAt = new Date().toISOString();
    }
    
    if (diffMinutes > 1440 && ticket.status === 'open') {
      ticket.status = 'resolved';
      ticket.updatedAt = new Date().toISOString();
    }
  });
  
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

// Run simulation every minute
setInterval(simulateTicketUpdates, 60000);

// ============================================
// === RENDER PRODUCT GRID ===
// ============================================
const grid = document.getElementById("product-grid");

function stockBadge(stock) {
  if (stock <= 0) return `<span class="stock out">Out of stock</span>`;
  if (stock <= 5) return `<span class="stock low">Only ${stock} left</span>`;
  return `<span class="stock in">In stock</span>`;
}

function renderProducts() {
  if (!grid) return;
  grid.innerHTML = "";
  
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
            <button class="btn btn-primary buy-discord" ${p.stock <= 0 ? "disabled" : ""} data-id="${p.id}">Buy Now</button>
            <button class="btn add-cart" ${p.stock <= 0 ? "disabled" : ""} data-id="${p.id}">Add</button>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}
renderProducts();

// ============================================
// === FAKE ORDERS WIDGET ===
// ============================================
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
setInterval(renderFakeOrders, 25000);

// ============================================
// === CART FUNCTIONALITY ===
// ============================================
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
  updateCartBadge();
}

function changeQty(id, delta) {
  const pid = String(id);
  if (!cart[pid]) return;
  cart[pid] = Math.max(0, cart[pid] + delta);
  if (cart[pid] === 0) delete cart[pid];
  saveCart(); 
  renderCart();
  updateCartBadge();
}

function clearCart() { cart = {}; saveCart(); renderCart(); updateCartBadge(); }

// Cart modal elements
const cartBtn = document.getElementById('cart-btn');
const cartBadge = document.getElementById('cart-badge');
const cartItemsEl = document.getElementById('cart-items');
const cartCountEl = document.getElementById('cart-count');
const cartTotalEl = document.getElementById('cart-total');
const cartClose = document.getElementById('cart-close');
const clearBtn = document.getElementById('clear-cart');
const checkoutBtn = document.getElementById('checkout-btn');

function updateCartBadge() {
  const c = cartCount();
  if (c > 0) {
    cartBadge.textContent = c;
    cartBadge.hidden = false;
  } else {
    cartBadge.hidden = true;
  }
}

function renderCart() {
  if (!cartItemsEl) return;
  const keys = Object.keys(cart);
  if (!keys.length) {
    cartItemsEl.innerHTML = '<p class="muted">Your cart is empty.</p>';
    cartCountEl.textContent=''; 
    cartTotalEl.textContent='€0.00'; 
    return;
  }
  cartItemsEl.innerHTML = '';
  keys.forEach(id=>{
    const qty = cart[id];
    const p = products.find(x=>String(x.id)===id);
    if (!p) return;
    const row = document.createElement('div');
    row.className='cart-row';
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

// Cart controls
if (cartBtn) {
  cartBtn.addEventListener('click', (e)=>{ 
    e.preventDefault(); 
    openModal('cart');
    renderCart(); 
  });
}

if (cartClose) {
  cartClose.addEventListener('click', ()=>{ 
    closeAllModals();
  });
}

if (grid) {
  grid.addEventListener('click', (e)=>{
    const add = e.target.closest('.add-cart');
    const buy = e.target.closest('.buy-discord');
    if (add) { 
      const id = Number(add.dataset.id); 
      addToCart(id); 
      add.animate([{transform:'scale(1)'},{transform:'scale(1.06)'},{transform:'scale(1)'}],{duration:200}); 
    }
    if (buy) { 
      const id = Number(buy.dataset.id); 
      addToCart(id);
      setTimeout(() => openCheckoutModal(), 100);
    }
  });
}

if (cartItemsEl) {
  cartItemsEl.addEventListener('click', (e)=>{
    const btn = e.target.closest('button'); 
    if (!btn) return;
    const action = btn.dataset.action; 
    const id = Number(btn.dataset.id);
    if (action==='inc') changeQty(id,1);
    if (action==='dec') changeQty(id,-1);
    if (action==='rem') { delete cart[String(id)]; saveCart(); renderCart(); updateCartBadge(); }
  });
}

if (clearBtn) {
  clearBtn.addEventListener('click', ()=>{ clearCart(); });
}

if (checkoutBtn) {
  checkoutBtn.addEventListener('click', ()=>{ openCheckoutModal(); });
}

// Initialize cart
renderCart();
updateCartBadge();

// ============================================
// === CHECKOUT MODAL ===
// ============================================
const checkoutClose = document.getElementById('checkout-close');
const checkoutCancel = document.getElementById('checkout-cancel');
const createTicketBtn = document.getElementById('create-ticket-btn');
const checkoutItems = document.getElementById('checkout-items');
const checkoutTotal = document.getElementById('checkout-total');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const discordInput = document.getElementById('discord');
const notesInput = document.getElementById('notes');

const accountInfo = getAccountInfo();
if (accountInfo) {
  usernameInput.value = accountInfo.username || '';
  emailInput.value = accountInfo.email || '';
  discordInput.value = accountInfo.discord || '';
}

function openCheckoutModal() {
  if (!Object.keys(cart).length) {
    alert('Your cart is empty!');
    return;
  }
  
  openModal('checkout');
  
  // Populate checkout items
  if (checkoutItems) {
    checkoutItems.innerHTML = '';
    const keys = Object.keys(cart);
    keys.forEach(id => {
      const qty = cart[id];
      const p = products.find(x=>String(x.id)===id);
      if (!p) return;
      const line = document.createElement('div');
      line.className = 'checkout-item';
      line.innerHTML = `
        <div>${qty}× ${p.name}</div>
        <div>€${(p.price * qty).toFixed(2)}</div>
      `;
      checkoutItems.appendChild(line);
    });
  }
  
  if (checkoutTotal) {
    checkoutTotal.textContent = `€${cartTotal().toFixed(2)}`;
  }
}

if (checkoutClose) {
  checkoutClose.addEventListener('click', ()=>{ closeAllModals(); });
}

if (checkoutCancel) {
  checkoutCancel.addEventListener('click', ()=>{ closeAllModals(); });
}

if (createTicketBtn) {
  createTicketBtn.addEventListener('click', async ()=>{
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const discord = discordInput.value.trim();
    const notes = notesInput.value.trim();
    
    if (!username || !email || !discord) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (!email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }
    
    if (!Object.keys(cart).length) {
      alert('Your cart is empty');
      return;
    }
    
    // Build items array
    const items = [];
    const keys = Object.keys(cart);
    keys.forEach(id => {
      const qty = cart[id];
      const p = products.find(x=>String(x.id)===id);
      if (p) {
        items.push({
          id: p.id,
          name: p.name,
          qty: qty,
          price: p.price
        });
      }
    });
    
    // Create ticket
    const ticket = createTicket({
      username,
      email,
      discord,
      items,
      total: cartTotal(),
      notes
    });
    
    // Show success message
    alert(`✅ Ticket created!\n\nTicket ID: ${ticket.id}\n\nA staff member will contact you on Discord shortly to complete the order.`);
    
    // Clear cart and close modal
    clearCart();
    closeAllModals();
    
    // Open Discord
    window.open(DISCORD_LINK, '_blank');
  });
}

// ============================================
// === ACCOUNT / TICKETS MODAL ===
// ============================================
const accountBtn = document.getElementById('account-btn');
const accountClose = document.getElementById('account-close');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const ticketsList = document.getElementById('tickets-list');
const profileInfo = document.getElementById('profile-info');

if (accountBtn) {
  accountBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    openModal('account');
    renderAccountData();
  });
}

if (accountClose) {
  accountClose.addEventListener('click', ()=>{ closeAllModals(); });
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', ()=>{
    const tab = btn.dataset.tab;
    
    // Hide all tabs
    tabContents.forEach(content => {
      content.classList.remove('active');
    });
    
    // Remove active from all buttons
    tabBtns.forEach(b => {
      b.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tab}-tab`).classList.add('active');
    btn.classList.add('active');
  });
});

function renderAccountData() {
  const tickets = getTickets();
  const account = getAccountInfo();
  
  // Render tickets
  if (ticketsList) {
    if (!tickets.length) {
      ticketsList.innerHTML = '<p class="muted">No tickets yet. Complete a purchase to create one!</p>';
    } else {
      ticketsList.innerHTML = '';
      tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(ticket => {
        const ticketEl = document.createElement('div');
        ticketEl.className = 'ticket-item';
        
        const createdDate = new Date(ticket.createdAt);
        const createdStr = createdDate.toLocaleDateString() + ' ' + createdDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        let itemsHtml = '';
        ticket.items.forEach(item => {
          itemsHtml += `<div class="ticket-item-line"><span>${item.qty}× ${item.name}</span><span>€${(item.price * item.qty).toFixed(2)}</span></div>`;
        });
        
        ticketEl.innerHTML = `
          <div class="ticket-header">
            <div class="ticket-id">${ticket.id}</div>
            <span class="ticket-status ${ticket.status}">${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}</span>
          </div>
          <div class="ticket-info">
            <div class="ticket-detail">
              <div class="ticket-detail-label">Created</div>
              <div class="ticket-detail-value">${createdStr}</div>
            </div>
            <div class="ticket-detail">
              <div class="ticket-detail-label">Total</div>
              <div class="ticket-detail-value">€${ticket.total.toFixed(2)}</div>
            </div>
            <div class="ticket-detail">
              <div class="ticket-detail-label">Username</div>
              <div class="ticket-detail-value">${ticket.username}</div>
            </div>
            <div class="ticket-detail">
              <div class="ticket-detail-label">Discord</div>
              <div class="ticket-detail-value">${ticket.discord}</div>
            </div>
          </div>
          <div class="ticket-items">
            ${itemsHtml}
          </div>
        `;
        ticketsList.appendChild(ticketEl);
      });
    }
  }
  
  // Render profile
  if (profileInfo) {
    if (!account) {
      profileInfo.innerHTML = '<p class="muted">Not logged in. Complete a purchase to create an account.</p>';
    } else {
      profileInfo.innerHTML = `
        <div style="text-align: left;">
          <h4>Account Information</h4>
          <div style="display: grid; gap: 1rem; margin-top: 1rem;">
            <div>
              <div class="small muted">Minecraft Username</div>
              <div>${account.username}</div>
            </div>
            <div>
              <div class="small muted">Email</div>
              <div>${account.email}</div>
            </div>
            <div>
              <div class="small muted">Discord Username</div>
              <div>${account.discord}</div>
            </div>
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
              <p class="small muted">You have <strong>${getTickets().length}</strong> ticket(s)</p>
            </div>
          </div>
        </div>
      `;
    }
  }
}

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeAllModals();
    }
  });
});

console.log('✅ Wind SMP Shop loaded successfully!');
