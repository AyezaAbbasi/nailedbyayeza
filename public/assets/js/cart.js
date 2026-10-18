// Cart is stored in localStorage so it persists between pages/visits on this device.
const CART_KEY = 'nba_cart';

function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch(e){ return []; }
}
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); updateCartBadge(); }

function addToCart(item){
  const cart = getCart();
  const existing = cart.find(i => i.product_id === item.product_id && i.size === item.size && i.shape === item.shape && i.length === item.length);
  if (existing) existing.quantity += item.quantity;
  else cart.push(item);
  saveCart(cart);
}
function updateCartItemQty(index, quantity){
  const cart = getCart();
  if (cart[index]) cart[index].quantity = quantity;
  saveCart(cart);
}
function removeCartItem(index){
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}
function clearCart(){ localStorage.removeItem(CART_KEY); updateCartBadge(); }
function cartCount(){ return getCart().reduce((sum,i)=>sum+i.quantity,0); }
function cartTotal(){ return getCart().reduce((sum,i)=>sum+(i.price*i.quantity),0); }

function updateCartBadge(){
  document.querySelectorAll('.cart-badge').forEach(b => b.textContent = cartCount());
}
document.addEventListener('DOMContentLoaded', updateCartBadge);

function showToast(msg){
  let toast = document.querySelector('.toast');
  if (!toast){ toast = document.createElement('div'); toast.className='toast'; document.body.appendChild(toast); }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 2200);
}