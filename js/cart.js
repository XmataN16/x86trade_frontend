// js/cart.js
// Скрипт для cart.html: если авторизован — загружает с сервера, иначе — из localStorage

function formatPrice(v) { return v ? (v + " ₽") : "0 ₽"; }

async function loadCartItems() {
  if (window.api && window.api.isAuthenticated()) {
    try {
      const items = await window.api.apiGet("/api/cart"); // ожидаем [{id, user_id, product_id, quantity}, ...]
      // Для каждого элемента запрашиваем данные продукта (можно оптимизировать на бэке — join)
      const products = await Promise.all(items.map(async it => {
        try {
          // GET /api/products?id=123 возвращает один объект в вашем бэке
          const p = await window.api.apiGet("/api/products", { id: it.product_id });
          return {
            product_id: it.product_id,
            quantity: it.quantity,
            id: it.id,
            name: p.name,
            price: p.price,
            image: p.image_path || './images/catalog_types/cpu.svg'
          };
        } catch (e) {
          // fallback minimal
          return { product_id: it.product_id, quantity: it.quantity, id: it.id, name: "Товар #" + it.product_id, price: 0, image: './images/catalog_types/cpu.svg' };
        }
      }));
      return products;
    } catch (err) {
      console.error("Failed load server cart", err);
      return []; // в UI покажем пустую корзину
    }
  } else {
    // guest cart
    return JSON.parse(localStorage.getItem("cart")) || [];
  }
}

async function renderCart() {
  const container = document.getElementById("cartContent");
  if (!container) return;
  const items = await loadCartItems();
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="empty_cart"><p>Ваша корзина пуста.</p><a href="catalog.html" class="continue_shopping_btn">Продолжить покупки</a></div>`;
    return;
  }
  let total = 0;
  let html = `<div class="cart_items"><div class="cart_header"><div>Товар</div><div>Цена</div><div>Кол-во</div><div>Сумма</div><div></div></div>`;
  for (const it of items) {
    const sum = (parseFloat(it.price) || 0) * (it.quantity || 0);
    total += sum;
    html += `<div class="cart_item">
      <div class="cart_col cart_product"><img src="${it.image}" class="cart_product_img"><span class="cart_product_name">${escapeHtml(it.name)}</span></div>
      <div class="cart_col">${formatPrice(it.price)}</div>
      <div class="cart_col">${it.quantity}</div>
      <div class="cart_col">${formatPrice(sum)}</div>
      <div class="cart_col"><button class="remove_btn" data-id="${it.product_id}">Удалить</button></div>
    </div>`;
  }
  html += `</div><div class="cart_total"><strong>Итого: ${formatPrice(total)}</strong></div>`;
  container.innerHTML = html;

  // attach remove handlers
  container.querySelectorAll(".remove_btn").forEach(btn => btn.addEventListener("click", async (e) => {
    const pid = parseInt(e.currentTarget.dataset.id);
    if (window.api && window.api.isAuthenticated()) {
      try {
        await window.api.apiDelete("/api/cart", { product_id: pid });
      } catch (err) {
        console.error("remove cart item error", err);
      }
    } else {
      let cart = JSON.parse(localStorage.getItem("cart")) || [];
      cart = cart.filter(x => x.id !== pid);
      localStorage.setItem("cart", JSON.stringify(cart));
    }
    if (window.updateCartCount) window.updateCartCount();
    await renderCart();
  }));
}

// small escape
function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

document.addEventListener("DOMContentLoaded", function () {
  renderCart();
});
