// Injects the shared header/footer + mobile nav + cart drawer into any page
// that includes a <div id="site-header"></div> and <div id="site-footer"></div>.

const NAV_LINKS = [
  { href:'index.html', label:'Home' },
  { href:'shop.html', label:'Shop' },
  { href:'shop.html?category=Seasonal Collections', label:'Collections' },
  { href:'custom-nails.html', label:'Custom Nails' },
  { href:'how-it-works.html', label:'How It Works' },
  { href:'about.html', label:'About Us' },
  { href:'contact.html', label:'Contact' }
];

function renderHeader(){
  const el = document.getElementById('site-header');
  if (!el) return;
  const page = location.pathname.split('/').pop() || 'index.html';
  el.innerHTML = `
    <header>
      <div class="container nav-row">
        <a href="index.html" class="logo">nailedbyayeza</a>
        <nav class="main-nav" id="mainNav">
          <ul>
            ${NAV_LINKS.map(l => `<li><a href="${l.href}" class="${page===l.href.split('?')[0]?'active':''}">${l.label}</a></li>`).join('')}
          </ul>
        </nav>
        <div class="nav-actions">
          <span class="cart-icon" id="cartIconBtn">🛍️<span class="cart-badge">0</span></span>
          <div class="burger" id="burgerBtn">☰</div>
        </div>
      </div>
    </header>
    <div class="cart-overlay" id="cartOverlay"></div>
    <div class="cart-drawer" id="cartDrawer">
      <div class="cart-drawer-header"><h3 style="font-size:1.1rem;">Your Bag</h3><span style="cursor:pointer;" id="cartCloseBtn">✕</span></div>
      <div class="cart-items" id="cartItemsList"></div>
      <div class="cart-footer">
        <div style="display:flex; justify-content:space-between; margin-bottom:14px; font-weight:600;">
          <span>Subtotal</span><span id="cartSubtotal">Rs. 0</span>
        </div>
        <a href="checkout.html" class="btn btn-gold btn-block">Checkout</a>
      </div>
    </div>
  `;
  document.getElementById('burgerBtn').addEventListener('click', () => document.getElementById('mainNav').classList.toggle('open'));
  document.getElementById('cartIconBtn').addEventListener('click', openCartDrawer);
  document.getElementById('cartCloseBtn').addEventListener('click', closeCartDrawer);
  document.getElementById('cartOverlay').addEventListener('click', closeCartDrawer);
  renderCartDrawer();
  updateCartBadge();
}

function openCartDrawer(){ renderCartDrawer(); document.getElementById('cartDrawer').classList.add('open'); document.getElementById('cartOverlay').classList.add('open'); }
function closeCartDrawer(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('cartOverlay').classList.remove('open'); }

function renderCartDrawer(){
  const list = document.getElementById('cartItemsList');
  if (!list) return;
  const cart = getCart();
  if (cart.length === 0){ list.innerHTML = '<p style="color:var(--text-faint); text-align:center; margin-top:30px;">Your bag is empty.</p>'; }
  else {
    list.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <div class="photo-slot missing" data-filename="${item.product_id}.jpg"></div>
        <div class="cart-item-info">
          <div class="name">${item.product_name}</div>
          <div class="meta">${item.shape || ''} · ${item.length || ''} · Size ${item.size || ''} · Qty ${item.quantity}</div>
          <div class="meta">Rs. ${(item.price*item.quantity).toLocaleString()}</div>
        </div>
        <span style="cursor:pointer; color:var(--text-faint);" onclick="removeCartItem(${i}); renderCartDrawer();">✕</span>
      </div>`).join('');
  }
  const subtotal = document.getElementById('cartSubtotal');
  if (subtotal) subtotal.textContent = `Rs. ${cartTotal().toLocaleString()}`;
}

function renderFooter(){
  const el = document.getElementById('site-footer');
  if (!el) return;
  el.innerHTML = `
    <footer>
      <div class="container">
        <div class="footer-grid">
          <div>
            <a href="index.html" class="logo" style="font-size:1.5rem;">nailedbyayeza</a>
            <p style="color:var(--text-soft); font-size:.88rem; margin-top:12px; max-width:260px;">Handmade press-on nails, designed and shipped from Islamabad, Pakistan.</p>
          </div>
          <div><h4>Shop</h4><ul>
            <li><a href="shop.html">All Nails</a></li>
            <li><a href="shop.html?filter=new">New Arrivals</a></li>
            <li><a href="shop.html?filter=best">Best Sellers</a></li>
            <li><a href="custom-nails.html">Custom Nails</a></li>
          </ul></div>
          <div><h4>Help</h4><ul>
            <li><a href="how-it-works.html">How It Works</a></li>
            <li><a href="nail-care.html">Nail Care Guide</a></li>
            <li><a href="contact.html">Contact Us</a></li>
          </ul></div>
          <div><h4>Connect</h4><ul>
            <li><a href="https://instagram.com/nailedbyayeza" target="_blank">Instagram</a></li>
            <li><a href="mailto:hello@nailedbyayeza.com">hello@nailedbyayeza.com</a></li>
          </ul></div>
        </div>
        <div class="footer-bottom">© 2026 nailedbyayeza. All designs handmade with love.</div>
      </div>
    </footer>
  `;
}

document.addEventListener('DOMContentLoaded', () => { renderHeader(); renderFooter(); });