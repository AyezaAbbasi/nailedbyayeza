const nodemailer = require('nodemailer');

// Reads Gmail credentials from .env (EMAIL_USER, EMAIL_PASS, EMAIL_TO).
// If they aren't set, email sending is silently skipped so the site still works.
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

async function sendOrderEmail(order) {
  if (!transporter) {
    console.log('Email not configured — skipping order notification email.');
    return;
  }

  const itemsHtml = order.items.map(i =>
    `<li>${i.product_name} — ${i.shape || ''} ${i.length || ''} Size ${i.size || ''} × ${i.quantity} — Rs. ${(i.price * i.quantity).toLocaleString()}</li>`
  ).join('');

  const html = `
    <h2>New order #${order.order_number}</h2>
    <p><b>Customer:</b> ${order.customer_name}<br>
       <b>Phone:</b> ${order.phone}<br>
       <b>Email:</b> ${order.email}</p>
    <p><b>Delivery Address:</b> ${order.house_street}, ${order.area}, ${order.city}, ${order.province} ${order.postal_code || ''}</p>
    <p><b>Items:</b></p>
    <ul>${itemsHtml}</ul>
    <p><b>Delivery Charge:</b> Rs. ${(order.delivery_charge || 0).toLocaleString()}</p>
    <p><b>Total:</b> Rs. ${order.total.toLocaleString()}</p>
    <p><b>Payment Method:</b> ${order.payment_method}</p>
  `;

  // 1) Notification to the shop owner
  try {
    await transporter.sendMail({
      from: `"nailedbyayeza" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `New Order #${order.order_number} — Rs. ${order.total.toLocaleString()}`,
      html
    });
    console.log(`Order notification email sent for order #${order.order_number}`);
  } catch (err) {
    console.error('Failed to send order email:', err.message);
  }

  // 2) Confirmation to the customer who placed the order
  if (order.email) {
    const customerHtml = `
      <h2>Thank you for your order, ${order.customer_name}!</h2>
      <p>We have received your order <b>#${order.order_number}</b> and will start preparing it soon.</p>
      <p><b>Items:</b></p>
      <ul>${itemsHtml}</ul>
      ${order.discount ? `<p><b>Discount:</b> −Rs. ${order.discount.toLocaleString()}</p>` : ''}
      <p><b>Delivery Charges:</b> Rs. ${(order.delivery_charge || 0).toLocaleString()}</p>
      <p><b>Total:</b> Rs. ${order.total.toLocaleString()}</p>
      <p><b>Payment Method:</b> ${order.payment_method}</p>
      <p><b>Delivery Address:</b> ${order.house_street}, ${order.area}, ${order.city}, ${order.province} ${order.postal_code || ''}</p>
      <p>We will contact you on ${order.phone} if we need anything. — nailedbyayeza</p>
    `;
    try {
      await transporter.sendMail({
        from: `"nailedbyayeza" <${process.env.EMAIL_USER}>`,
        to: order.email,
        subject: `Your nailedbyayeza order #${order.order_number} is confirmed`,
        html: customerHtml
      });
      console.log(`Customer confirmation email sent for order #${order.order_number}`);
    } catch (err) {
      console.error('Failed to send customer email:', err.message);
    }
  }
}

async function sendCustomOrderEmail(request) {
  if (!transporter) return;
  const html = `
    <h2>New custom order request #C${String(request.request_number).padStart(3, '0')}</h2>
    <p><b>Customer:</b> ${request.customer_name}<br>
       <b>Phone:</b> ${request.phone}<br>
       <b>Email:</b> ${request.email || '—'}</p>
    <p><b>Color:</b> ${request.color || '—'} &nbsp; <b>Shape:</b> ${request.shape || '—'} &nbsp; <b>Length:</b> ${request.length || '—'}</p>
    <p><b>Description:</b> ${request.description || '—'}</p>
  `;
  try {
    await transporter.sendMail({
      from: `"nailedbyayeza" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `New Custom Order Request #C${String(request.request_number).padStart(3, '0')}`,
      html
    });
  } catch (err) {
    console.error('Failed to send custom order email:', err.message);
  }
}

function esc(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Tells the shop owner a customer used the contact form. Reply-To is the customer, so hitting
// "Reply" in Gmail also goes straight to them.
async function sendContactNotification(msg) {
  if (!transporter) return;
  try {
    await transporter.sendMail({
      from: `"nailedbyayeza" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      replyTo: msg.email,
      subject: `New message from ${msg.name}${msg.subject ? ' — ' + msg.subject : ''}`,
      html: `
        <h2>New contact message</h2>
        <p><b>Name:</b> ${esc(msg.name)}<br>
           <b>Email:</b> ${esc(msg.email)}<br>
           <b>Phone:</b> ${esc(msg.phone || '—')}<br>
           <b>Subject:</b> ${esc(msg.subject || '—')}</p>
        <p style="white-space:pre-wrap;">${esc(msg.message)}</p>
        <p style="color:#888;">You can also reply from the admin panel, Messages section.</p>`
    });
  } catch (err) {
    console.error('Failed to send contact notification:', err.message);
  }
}

// Sends the owner's reply to the customer. Throws on failure so the admin panel can show the error.
async function sendContactReply(msg, replyText) {
  if (!transporter) throw new Error('Email is not configured on the server (EMAIL_USER / EMAIL_PASS missing)');
  await transporter.sendMail({
    from: `"nailedbyayeza" <${process.env.EMAIL_USER}>`,
    to: msg.email,
    replyTo: process.env.EMAIL_TO || process.env.EMAIL_USER,
    subject: `Re: ${msg.subject || 'Your message to nailedbyayeza'}`,
    html: `
      <p style="white-space:pre-wrap;">${esc(replyText)}</p>
      <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
      <p style="color:#888;font-size:13px;">Your message:</p>
      <p style="color:#888;font-size:13px;white-space:pre-wrap;">${esc(msg.message)}</p>
      <p style="color:#888;font-size:13px;">— nailedbyayeza</p>`
  });
}

module.exports = { sendOrderEmail, sendCustomOrderEmail, sendContactNotification, sendContactReply };