let adminProducts = [];

async function loadAdminProducts() {
  try {
    const res = await fetch('https://fakestoreapi.com/products');
    const apiProducts = await res.json();
    const custom = JSON.parse(localStorage.getItem('shopmaster_custom_products')) || [];
    adminProducts = [...apiProducts, ...custom];
    
    renderAdminProducts();
    document.getElementById('statProducts').textContent = adminProducts.length;
  } catch (err) {
    console.error('Error cargando productos:', err);
  }
}

function renderAdminProducts() {
  const tbody = document.getElementById('adminProductsTable');
  tbody.innerHTML = '';
  
  const apiCount = adminProducts.length - (JSON.parse(localStorage.getItem('shopmaster_custom_products')) || []).length;
  
  adminProducts.forEach((p, i) => {
    const isCustom = i >= apiCount;
    const row = `
      <tr>
        <td>${p.id || '—'}</td>
        <td><img src="${p.image}" width="50" style="height:50px; object-fit:contain;"></td>
        <td class="fw-medium">${p.title.substring(0,45)}${p.title.length>45?'...':''}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td><span class="badge bg-info">${p.category}</span></td>
        <td>
          <button class="btn btn-sm btn-outline-primary" disabled title="Edición no implementada"><i class="fas fa-edit"></i></button>
          ${isCustom ? 
            `<button class="btn btn-sm btn-outline-danger" onclick="deleteCustomProduct(${i})"><i class="fas fa-trash"></i></button>` :
            '<button class="btn btn-sm btn-outline-secondary" disabled>API</button>'
          }
        </td>
      </tr>`;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function deleteCustomProduct(globalIndex) {
  if (!confirm('¿Eliminar este producto permanentemente?')) return;
  
  let custom = JSON.parse(localStorage.getItem('shopmaster_custom_products')) || [];
  const apiCount = adminProducts.length - custom.length;
  
  if (globalIndex >= apiCount) {
    const customIdx = globalIndex - apiCount;
    custom.splice(customIdx, 1);
    localStorage.setItem('shopmaster_custom_products', JSON.stringify(custom));
    loadAdminProducts();
    alert('Producto eliminado');
  }
}

function saveNewProduct() {
  const title = document.getElementById('newTitle').value.trim();
  const price = parseFloat(document.getElementById('newPrice').value);
  const category = document.getElementById('newCategory').value;
  const desc = document.getElementById('newDescription').value.trim();
  const img = document.getElementById('newImage').value.trim() || 'https://via.placeholder.com/400?text=Producto';
  
  if (!title || isNaN(price) || price <= 0) {
    alert('Título y precio son obligatorios y deben ser válidos');
    return;
  }
  
  const newP = {
    id: Date.now(),
    title,
    price,
    description: desc || 'Sin descripción',
    category,
    image: img,
    isCustom: true
  };
  
  let custom = JSON.parse(localStorage.getItem('shopmaster_custom_products')) || [];
  custom.push(newP);
  localStorage.setItem('shopmaster_custom_products', JSON.stringify(custom));
  
  bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
  loadAdminProducts();
  alert('Producto agregado con éxito');
}

function loadOrdersHistory() {
  const orders = JSON.parse(localStorage.getItem('shopmaster_orders')) || [];
  const container = document.getElementById('ordersHistory');
  container.innerHTML = orders.length === 0 
    ? '<p class="text-muted text-center py-4">Aún no hay pedidos registrados.</p>'
    : '';
  
  let totalSales = 0;
  orders.forEach(o => {
    totalSales += parseFloat(o.total);
    const html = `
      <div class="card mb-3 shadow-sm">
        <div class="card-header d-flex justify-content-between">
          <strong>Pedido #${o.id}</strong>
          <span>${o.date}</span>
        </div>
        <div class="card-body">
          <p><strong>Cliente:</strong> ${o.customer}</p>
          <p><strong>Total:</strong> $${o.total}</p>
          <details>
            <summary>${o.items.length} producto(s)</summary>
            <ul class="list-group list-group-flush mt-2">
              ${o.items.map(i => `
                <li class="list-group-item d-flex justify-content-between">
                  <span>${i.quantity} × ${i.title.substring(0,40)}${i.title.length>40?'...':''}</span>
                  <span>$${(i.price * i.quantity).toFixed(2)}</span>
                </li>
              `).join('')}
            </ul>
          </details>
        </div>
      </div>`;
    container.insertAdjacentHTML('beforeend', html);
  });
  
  document.getElementById('statSales').textContent = `$${totalSales.toFixed(2)}`;
  document.getElementById('statOrders').textContent = orders.length;
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminProducts();
  loadOrdersHistory();
});