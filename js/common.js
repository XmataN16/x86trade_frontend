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
