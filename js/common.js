// --- Общий скрипт для всех страниц ---

// --- Показ текущего времени ---
function updateTime() {
  const now = new Date();
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false, // 24-часовой формат
  };
  const timeString = now.toLocaleTimeString("ru-RU", options);
  const timeElement = document.getElementById("current-time");
  if (timeElement) {
    timeElement.textContent = timeString;
  }
}

// Обновляем время каждую секунду
let timeIntervalId;
function startClock() {
  if (!timeIntervalId) {
    timeIntervalId = setInterval(updateTime, 1000);
    updateTime(); // Инициализируем сразу при запуске
  }
}

// --- Инициализация бургер-меню ---
function initBurgerMenu() {
  const menuBtn = document.querySelector(".menu_btn");
  const menuList = document.querySelector(".menu_list");

  if (menuBtn && menuList) {
    menuBtn.addEventListener("click", function () {
      this.classList.toggle("active");
      menuList.classList.toggle("active");
    });
  }
}

// --- Функция обновления счетчика товаров в корзине ---
// Переносим сюда, чтобы была доступна глобально
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Находим иконку корзины
  const cartIcon = document.querySelector(
    '.user-actions_link img[src="images/cart.svg"]'
  );
  if (cartIcon) {
    // Удаляем предыдущий счетчик, если есть
    const existingBadge = cartIcon.parentElement.querySelector(".cart-badge");
    if (existingBadge) {
      existingBadge.remove();
    }

    // Создаем новый счетчик
    if (totalItems > 0) {
      const badge = document.createElement("span");
      badge.className = "cart-badge";
      badge.textContent = totalItems;
      cartIcon.parentElement.appendChild(badge);
    }
  }
}

// --- Запуск функций при загрузке DOM ---
document.addEventListener("DOMContentLoaded", function () {
  initBurgerMenu();
  startClock(); // Запускаем часы
  updateCartCount(); // Обновляем счетчик при загрузке страницы
});


// добавляем в common.js
function isAuthenticated() {
  return !!localStorage.getItem("access_token");
}

// отрисовать ссылки в шапке: если авторизован — показать "Выход", иначе "Войти"
function updateAuthUI() {
  const profileContainer = document.querySelector(".profile-container");
  if (!profileContainer) return;
  // удалим старое содержимое и вставим ссылку
  if (isAuthenticated()) {
    profileContainer.innerHTML = `<a href="#" id="logoutLink" class="user-actions_link"><img src="images/user.svg" alt="Профиль" class="profile-icon"><span class="tooltip">Выход</span></a>`;
    const l = document.getElementById("logoutLink");
    if (l) {
      l.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await api.authLogout();
        } catch (err) {
          console.warn("logout error", err);
        }
        // очистим и обновим UI
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        updateAuthUI();
        if (window.updateCartCount) window.updateCartCount();
        window.location.href = "index.html";
      });
    }
  } else {
    profileContainer.innerHTML = `<a href="login.html" class="user-actions_link"><img src="images/user.svg" alt="Профиль" class="profile-icon"><span class="tooltip">Войти</span></a>`;
  }
}

// переопределим updateCartCount чтобы поддерживать серверную корзину
async function updateCartCount() {
  try {
    if (window.api && window.api.isAuthenticated()) {
      // запросим cart и посчитаем кол-во
      const items = await window.api.apiGet("/api/cart");
      const totalItems = (items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      localStorage.setItem("__cart_count", totalItems); // optional cache
      // отрисуем бейдж
      renderCartBadge(totalItems);
      return;
    }
  } catch (e) {
    console.warn("Failed to load cart count from server", e);
  }
  // fallback guest
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const total = cart.reduce((s, it) => s + (it.quantity || 0), 0);
  renderCartBadge(total);
}

function renderCartBadge(totalItems) {
  const cartIcon = document.querySelector('.user-actions_link img[src="images/cart.svg"]');
  if (!cartIcon) return;
  const parent = cartIcon.parentElement;
  const existing = parent.querySelector(".cart-badge");
  if (existing) existing.remove();
  if (totalItems > 0) {
    const badge = document.createElement("span");
    badge.className = "cart-badge";
    badge.textContent = totalItems;
    parent.appendChild(badge);
  }
}

// запускаем при DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  initBurgerMenu();
  startClock();
  updateAuthUI();
  updateCartCount();
});
