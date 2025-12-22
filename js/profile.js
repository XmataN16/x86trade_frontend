document.addEventListener("DOMContentLoaded", async () => {
  if (!api.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }
  
  // Инициализация вкладок
  document.querySelectorAll('.tab_btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab_btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab_content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.dataset.tab + '_tab';
      document.getElementById(tabId).classList.add('active');
      
      // Загрузка заказов при переключении на соответствующую вкладку
      if (btn.dataset.tab === 'orders') {
        loadUserOrders();
      }
    });
  });
  
  // Загрузка данных профиля
  try {
    const u = await api.apiGet("/api/auth/me");
    document.getElementById("profileEmail").value = u.email || "";
    document.getElementById("profileFirstName").value = u.first_name || "";
    document.getElementById("profileLastName").value = u.last_name || "";
    document.getElementById("profilePhone").value = u.phone || "";
  } catch (e) {
    console.error(e);
    alert("Ошибка загрузки профиля");
  }
  
  // Сохранение профиля
  document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await api.apiPut("/api/auth/me", {
        first_name: document.getElementById("profileFirstName").value,
        last_name: document.getElementById("profileLastName").value,
        phone: document.getElementById("profilePhone").value
      });
      alert("Профиль сохранён");
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения: " + (err.message || err));
    }
  });
  
  // Изначально загружаем заказы
  loadUserOrders();
});

async function loadUserOrders() {
  const container = document.getElementById("ordersContainer");
  if (!container) return;
  
  container.innerHTML = '<div class="loader">Загрузка заказов...</div>';
  
  try {
    const orders = await api.apiGet("/api/orders");
    
    if (!orders || orders.length === 0) {
      container.innerHTML = `<div class="no_orders">У вас пока нет заказов.</div>`;
      return;
    }
    
    let html = `<div class="orders_list">`;
    
    // Сортируем заказы по дате создания (новые первыми)
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    orders.forEach(order => {
      const statusClass = order.status.toLowerCase().replace(' ', '_');
      html += `
        <div class="order_card">
          <div class="order_header">
            <div>
              <div class="order_number">Заказ #${order.id}</div>
              <div class="order_date">Создан: ${order.created_at}</div>
            </div>
            <div class="order_status ${statusClass}">
              ${formatOrderStatus(order.status)}
            </div>
          </div>
          
          <div class="order_total">Итого: ${Number(order.total_amount).toFixed(2)} ₽</div>
          
          ${order.delivery ? `
            <div class="order_delivery">
              <div class="order_delivery_title">Доставка</div>
              <div>Статус: ${formatDeliveryStatus(order.delivery.status)}</div>
              <div>Адрес: ${order.delivery.address}</div>
            </div>
          ` : ''}
          
          <div class="order_actions">
            <button class="order_btn order_details_btn" data-order-id="${order.id}">Детали</button>
            ${canCancelOrder(order.status) ? 
              `<button class="order_btn order_cancel_btn" data-order-id="${order.id}">Отменить</button>` : 
              ''
            }
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Добавление обработчиков событий
    document.querySelectorAll('.order_details_btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const orderId = e.currentTarget.dataset.orderId;
    window.location.href = `order_details.html?order_id=${orderId}`;
  });
});
    
    document.querySelectorAll('.order_cancel_btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Вы уверены, что хотите отменить этот заказ?')) return;
        
        const orderId = e.currentTarget.dataset.orderId;
        try {
          await api.apiPut(`/api/orders/${orderId}/cancel`);
          alert('Заказ успешно отменен');
          loadUserOrders();
        } catch (err) {
          console.error('Ошибка отмены заказа:', err);
          alert('Не удалось отменить заказ: ' + (err.message || err));
        }
      });
    });
    
  } catch (err) {
    console.error('Ошибка загрузки заказов:', err);
    container.innerHTML = `<div class="error_message">Ошибка при загрузке заказов. Попробуйте обновить страницу.</div>`;
  }
}

// Вспомогательные функции
function formatOrderStatus(status) {
  const statuses = {
    'created': 'Создан',
    'processing': 'В обработке',
    'shipped': 'Отправлен',
    'delivered': 'Доставлен',
    'cancelled': 'Отменен'
  };
  return statuses[status.toLowerCase()] || status;
}

function formatDeliveryStatus(status) {
  const statuses = {
    'pending': 'Ожидает обработки',
    'processing': 'Готовится к отправке',
    'shipped': 'Отправлен',
    'delivered': 'Доставлен',
    'cancelled': 'Отменена'
  };
  return statuses[status.toLowerCase()] || status;
}

function canCancelOrder(status) {
  const cancelableStatuses = ['created', 'processing'];
  return cancelableStatuses.includes(status.toLowerCase());
}

function getImagePath(imagePath) {
  if (!imagePath) return './images/catalog_types/cpu.svg';
  if (imagePath.startsWith('http')) return imagePath;
  return `http://localhost:8080${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
}

// Для страницы деталей заказа (order_details.html) - создайте отдельный файл