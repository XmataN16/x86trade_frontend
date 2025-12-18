function escapeHtmlLocal(s) {
  // локальная защита: используем глобальную escapeHtml если есть, иначе простая реализация
  return (typeof escapeHtml === "function") ? escapeHtml(s) : String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

async function loadDeliveryMethods() {
  const sel = document.getElementById("deliveryMethodSelect");
  if (!sel) return;
  sel.innerHTML = '<option>Загрузка...</option>';
  try {
    if (!window.api || typeof window.api.apiGet !== "function") throw new Error("API недоступен");
    const res = await window.api.apiGet("/api/delivery_methods");
    sel.innerHTML = '<option value="">Выбрать способ доставки</option>' + res.map(d => `<option value="${d.id}">${escapeHtmlLocal(d.name)} — ${d.base_cost} ₽</option>`).join('');
  } catch (e) {
    console.error("failed load delivery methods", e);
    sel.innerHTML = '<option value="">Ошибка загрузки методов доставки</option>';
  }
}

async function loadPaymentMethods() {
  const sel = document.getElementById("paymentMethodSelect");
  if (!sel) return;
  sel.innerHTML = '<option>Загрузка...</option>';
  try {
    if (!window.api || typeof window.api.apiGet !== "function") throw new Error("API недоступен");
    const res = await window.api.apiGet("/api/payment_methods");
    sel.innerHTML = '<option value="">Выбрать способ оплаты</option>' + res.map(p => `<option value="${p.id}">${escapeHtmlLocal(p.name)}</option>`).join('');
  } catch (e) {
    console.error("failed load payment methods", e);
    sel.innerHTML = '<option value="">Ошибка загрузки методов оплаты</option>';
  }
}

async function loadCartForCheckout() {
  const container = document.getElementById("checkoutCart");
  if (!container) return;
  container.innerHTML = "<p>Загрузка корзины...</p>";
  try {
    let items = [];
    if (window.api && typeof window.api.isAuthenticated === "function" && window.api.isAuthenticated()) {
      items = await window.api.apiGet("/api/cart");
      // fetch product details
      items = await Promise.all(items.map(async it => {
        try {
          const p = await window.api.apiGet("/api/products", { id: it.product_id });
          return { product_id: it.product_id, quantity: it.quantity, name: p.name, price: p.price };
        } catch (e) {
          console.warn("failed to load product info for", it.product_id, e);
          return { product_id: it.product_id, quantity: it.quantity, name: "Товар #" + it.product_id, price: 0 };
        }
      }));
    } else {
      items = JSON.parse(localStorage.getItem("cart") || "[]");
    }

    if (!items || items.length === 0) {
      container.innerHTML = "<p>Корзина пуста</p>";
      return;
    }

    let html = '<div class="checkout_items">';
    let total = 0;
    for (const it of items) {
      const sum = (parseFloat(it.price) || 0) * (it.quantity || 0);
      total += sum;
      html += `<div class="checkout_item"><span>${escapeHtmlLocal(it.name)}</span> <span>${it.quantity} × ${it.price} ₽ = ${sum} ₽</span></div>`;
    }
    html += `</div><div class="checkout_total"><strong>Итого: ${total} ₽</strong></div>`;
    container.innerHTML = html;
  } catch (e) {
    console.error("Error loading cart for checkout:", e);
    container.innerHTML = "<p>Ошибка загрузки корзины</p>";
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // guard: ensure api is available
  if (!window.api) {
    console.warn("api.js not loaded yet");
  }
  await loadDeliveryMethods();
  await loadPaymentMethods();
  await loadCartForCheckout();

  const placeBtn = document.getElementById("placeOrderBtn");
  if (placeBtn) {
    placeBtn.addEventListener("click", async () => {
      if (!(window.api && typeof window.api.isAuthenticated === "function" && window.api.isAuthenticated())) {
        // если не авторизован — откроем модалку входа
        window.showAuthModal && window.showAuthModal("login");
        return;
      }

      const deliveryMethodID = document.getElementById("deliveryMethodSelect").value || null;
      const address = document.getElementById("deliveryAddress").value.trim();
      const recipientName = document.getElementById("recipientName").value.trim();
      const recipientPhone = document.getElementById("recipientPhone").value.trim();
      const comment = document.getElementById("orderComment").value.trim();

      try {
        const payload = {
          delivery_method_id: deliveryMethodID ? parseInt(deliveryMethodID) : null,
          address, recipient_name: recipientName, recipient_phone: recipientPhone, comment
        };
        const res = await window.api.apiPost("/api/orders", payload);
        document.getElementById("checkoutMessage").innerText = "Заказ оформлен, номер: " + res.order_id;
        window.location.href = "order_success.html?order_id=" + res.order_id;
      } catch (err) {
        console.error(err);
        alert("Ошибка создания заказа: " + (err.message || err));
      }
    });
  }
});