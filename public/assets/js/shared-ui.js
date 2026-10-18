// Reusable rendering helpers shared across shop.html, product.html, index.html

// Images now live on Cloudinary (full https:// URL). Old products saved before the
// switch still have a local "uploads/..." path, so this keeps both working.
function imgUrl(p){
  if (!p) return p;
  return /^https?:\/\//i.test(p) ? p : '/' + p;
}

function photoSlot(imgPath, altText, filenameHint, extraClass){
  if (imgPath){
    return `<div class="photo-slot ${extraClass||''}"><img src="${imgUrl(imgPath)}" alt="${altText||''}"></div>`;
  }
  return `<div class="photo-slot missing ${extraClass||''}" data-filename="${filenameHint||'photo.jpg'}"></div>`;
}

function productMainImage(product){
  const main = (product.images||[]).find(i => i.is_main) || (product.images||[])[0];
  return main ? main.path : null;
}
function productSecondImage(product){
  const imgs = product.images || [];
  const main = imgs.find(i => i.is_main) || imgs[0];
  const rest = imgs.filter(i => i !== main);
  return rest.length ? rest[0].path : null;
}

function renderProductCard(p){
  const img = productMainImage(p);
  const img2 = productSecondImage(p);
  const badges = [];
  if (p.is_new_arrival) badges.push('<span class="badge badge-new">New</span>');
  if (p.is_best_seller) badges.push('<span class="badge badge-best">Best Seller</span>');
  if (p.status === 'Sold Out') badges.push('<span class="badge badge-sold">Sold Out</span>');
  const filename = p.name.replace(/\s+/g,'-').toLowerCase()+'.jpg';
  const media = img
    ? `<div class="photo-slot">
        <img class="img-primary" src="${imgUrl(img)}" alt="${p.name}">
        ${img2 ? `<img class="img-secondary" src="${imgUrl(img2)}" alt="${p.name} alternate view">` : ''}
       </div>`
    : `<div class="photo-slot missing" data-filename="${filename}"></div>`;
  return `
    <a href="product.html?id=${p.id}" class="product-card">
      ${media}
      <div class="product-card-body">
        <div class="card-badges">${badges.join('')}</div>
        <h3>${p.name}</h3>
        <div class="price">Rs. ${Number(p.price).toLocaleString()}</div>
      </div>
    </a>`;
}

function optionChips(name, options, selected, onSelectFnName){
  return `<div class="option-row" data-group="${name}">
    ${options.map(o => `<div class="option-chip ${o===selected?'selected':''}" data-value="${o}" onclick="${onSelectFnName}('${name}', '${o}', this)">${o}</div>`).join('')}
  </div>`;
}

function starString(rating){ return '★'.repeat(rating) + '☆'.repeat(5-rating); }