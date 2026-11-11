// Reusable rendering helpers shared across shop.html, product.html, index.html

// Phone photos are often 3-10 MB, which is over the upload limits (and over Vercel's ~4.5 MB request cap).
// This shrinks an image in the browser before upload: max 1600px on the longest side, JPEG quality 0.82.
// Returns the original file untouched if it is already small or can't be processed.
async function compressImage(file, maxDim = 1600, quality = 0.82){
  try {
    if (!file || !/^image\//.test(file.type) || /gif$/.test(file.type)) return file;
    if (file.size < 400 * 1024) return file;
    let bmp;
    if (window.createImageBitmap){
      try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch(e){ bmp = null; }
    }
    if (!bmp){
      bmp = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(file); });
    }
    const w0 = bmp.width, h0 = bmp.height;
    const scale = Math.min(1, maxDim / Math.max(w0, h0));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w0 * scale); canvas.height = Math.round(h0 * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch(e){ return file; }
}

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