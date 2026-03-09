let allProducts = [];
let cart = JSON.parse(localStorage.getItem('shopmaster_cart')) || [];
let currentProduct = null;

const productModal  = new bootstrap.Modal('#productModal');
const cartOffcanvas = new bootstrap.Offcanvas('#cartOffcanvas');
const paymentModal  = new bootstrap.Modal('#paymentModal');
const toast         = new bootstrap.Toast('#mainToast');

function saveCart() {
  localStorage.setItem('shopmaster_cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById('cartCountBadge').textContent = count;
  document.getElementById('offcanvasCartCount').textContent = count;
}

function showToast(msg, bg = 'success') {
  document.getElementById('toastMessage').textContent = msg;
  document.querySelector('#mainToast .toast-header').className = `toast-header bg-${bg} text-white`;
  toast.show();
}

function renderProducts(products) {
  const container = document.getElementById('productsContainer');
  container.innerHTML = '';
  products.forEach(p => {
    const html = `
      <div class="col-6 col-md-6 col-lg-4 col-xl-3">
        <div class="card h-100">
          <img src="${p.image}" class="card-img-top" alt="${p.title}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fs-6 fw-semibold text-truncate">${p.title}</h5>
            <p class="card-text text-muted small flex-grow-1">${p.description.substring(0,80)}${p.description.length>80?'...':''}</p>
            <div class="mt-auto d-flex justify-content-between align-items-end">
              <span class="price">$${p.price.toFixed(2)}</span>
              <button class="btn btn-primary btn-sm" onclick="openProductModal(${p.id})">Ver más</button>
            </div>
          </div>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
}

function filterProducts() {
  const term = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!term) return renderProducts(allProducts);
  const filtered = allProducts.filter(p => 
    p.title.toLowerCase().includes(term) || 
    p.description.toLowerCase().includes(term) ||
    p.category.toLowerCase().includes(term)
  );
  renderProducts(filtered);
}

async function loadProducts() {
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    const apiProducts = await res.json();
    
    // Productos agregados por admin
    const custom = JSON.parse(localStorage.getItem('shopmaster_custom_products')) || [];
    allProducts = [...apiProducts, ...custom];
    
    renderProducts(allProducts);
  } catch (err) {
    document.getElementById('productsContainer').innerHTML = '<div class="col-12 text-center py-5 alert alert-danger">Error al cargar productos</div>';
  }
}

function openProductModal(id) {
  currentProduct = allProducts.find(p => p.id === id);
  if (!currentProduct) return;
  
  document.getElementById('modalTitle').textContent = currentProduct.title;
  document.getElementById('modalImage').src = currentProduct.image;
  document.getElementById('modalCategory').textContent = `Categoría: ${currentProduct.category}`;
  document.getElementById('modalDescription').textContent = currentProduct.description;
  document.getElementById('modalPrice').textContent = `$${currentProduct.price.toFixed(2)}`;
  document.getElementById('modalQuantity').value = 1;
  
  productModal.show();
}

function changeModalQty(delta) {
  const input = document.getElementById('modalQuantity');
  input.value = Math.max(1, (parseInt(input.value) || 1) + delta);
}

function addToCartFromModal() {
  const qty = parseInt(document.getElementById('modalQuantity').value) || 1;
  addToCart(currentProduct, qty);
  productModal.hide();
  showToast(`✓ ${qty} × ${currentProduct.title.slice(0,30)} añadido`);
}

function addToCart(product, quantity = 1) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) existing.quantity += quantity;
  else cart.push({ ...product, quantity });
  saveCart();
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  container.innerHTML = '';
  if (cart.length === 0) {
    container.innerHTML = '<div class="text-center py-5"><i class="fas fa-shopping-cart fa-4x text-muted mb-3"></i><p class="lead text-muted">Carrito vacío</p></div>';
    document.getElementById('cartTotalPrice').textContent = '$0.00';
    return;
  }
  let total = 0;
  cart.forEach((item, idx) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    const html = `
      <div class="cart-item p-3 mb-3">
        <div class="d-flex gap-3">
          <img src="${item.image}" width="70" height="70" style="object-fit:contain;" class="rounded">
          <div class="flex-grow-1">
            <div class="fw-semibold mb-1 text-truncate">${item.title}</div>
            <div class="d-flex justify-content-between align-items-center">
              <div class="input-group input-group-sm" style="width:110px;">
                <button class="btn btn-outline-secondary" onclick="updateCartQty(${idx},-1)">−</button>
                <span class="input-group-text">${item.quantity}</span>
                <button class="btn btn-outline-secondary" onclick="updateCartQty(${idx},1)">+</button>
              </div>
              <div class="text-end">
                <small class="text-muted">$${item.price.toFixed(2)}</small><br>
                <strong>$${itemTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>
          <button class="btn btn-sm btn-outline-danger" onclick="removeCartItem(${idx})"><i class="fas fa-trash"></i></button>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
  document.getElementById('cartTotalPrice').textContent = `$${total.toFixed(2)}`;
}

function updateCartQty(index, delta) {
  cart[index].quantity = Math.max(1, cart[index].quantity + delta);
  saveCart();
  renderCart();
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function showCart() {
  renderCart();
  cartOffcanvas.show();
}

function showPaymentModal() {
  if (cart.length === 0) return showToast('Carrito vacío', 'danger');
  cartOffcanvas.hide();
  paymentModal.show();
}

function processPayment(e) {
  e.preventDefault();
  const name = document.getElementById('customerName').value.trim();
  if (!name) return alert('Ingresa tu nombre');
  
  paymentModal.hide();
  
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Guardar pedido en historial
  const order = {
    id: Date.now(),
    date: new Date().toLocaleString('es-DO'),
    customer: name,
    total: total.toFixed(2),
    items: cart.map(i => ({ title: i.title, quantity: i.quantity, price: i.price }))
  };
  let orders = JSON.parse(localStorage.getItem('shopmaster_orders')) || [];
  orders.push(order);
  localStorage.setItem('shopmaster_orders', JSON.stringify(orders));
  
  generateReceipt(name);
  
  cart = [];
  saveCart();
  renderCart();
  
  setTimeout(() => showToast('¡Compra realizada! Recibo descargado', 'success'), 600);
}

function generateReceipt(customerName) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ format: [58, 280], unit: 'mm' });
  let y = 8;
  const center = 29;
  
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.text('FLUXORA', center, y, { align: 'center' }); y += 6;
  
  doc.setFontSize(8);
  doc.text('Recibo de Compra', center, y, { align: 'center' }); y += 5;
  doc.text('------------------------------', center, y, { align: 'center' }); y += 6;
  
  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text(`Fecha: ${new Date().toLocaleString('es-DO')}`, 4, y); y += 5;
  doc.text(`Cliente: ${customerName}`, 4, y); y += 7;
  doc.text('------------------------------', center, y, { align: 'center' }); y += 7;
  
  let total = 0;
  cart.forEach(item => {
    const lineTotal = item.price * item.quantity;
    total += lineTotal;
    const qty = `${item.quantity}x`;
    const title = item.title.length > 22 ? item.title.slice(0,19)+'..' : item.title;
    doc.text(qty, 4, y);
    doc.text(title, 12, y);
    doc.text(`$${lineTotal.toFixed(2)}`, 54, y, { align: 'right' });
    y += 5;
  });
  
  doc.text('------------------------------', center, y, { align: 'center' }); y += 7;
  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.text(`TOTAL: $${total.toFixed(2)}`, 4, y);
  
  y += 10;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text('Gracias por tu compra!', center, y, { align: 'center' });
  doc.save('recibo-fluxora.pdf');
  

}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadProducts();
});