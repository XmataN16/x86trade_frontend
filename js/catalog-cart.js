// --- Скрипт для страниц каталога и корзины ---

// --- Массив товаров (заглушка) ---
const products = [
  {
    id: 1,
    name: "Intel Core i5-13400F",
    price: 15999,
    image: "./images/cpus/i513400.jpg",
    category: "Процессоры",
    brand: "Intel",
  },
  {
    id: 2,
    name: "AMD Ryzen 5 7600X",
    price: 21999,
    image: "./images/catalog_types/cpu.svg",
    category: "Процессоры",
    brand: "AMD",
  },
  {
    id: 3,
    name: "ASUS TUF Gaming B760-PLUS WIFI",
    price: 18999,
    image: "./images/catalog_types/motherboard.svg",
    category: "Материнские платы",
    brand: "ASUS",
  },
  {
    id: 4,
    name: "Corsair Vengeance LPX 16GB DDR4 3200MHz",
    price: 4999,
    image: "./images/catalog_types/ram.svg",
    category: "Оперативная память",
    brand: "Corsair",
  },
  {
    id: 5,
    name: "NVIDIA GeForce RTX 4070 Ti Super",
    price: 79999,
    image: "./images/catalog_types/gpu.svg",
    category: "Видеокарты",
    brand: "NVIDIA",
  },
  {
    id: 6,
    name: "Kingston NV2 1TB M.2 PCIe 4.0",
    price: 5999,
    image: "./images/catalog_types/ssd.svg",
    category: "Твердотельные накопители (SSD)",
    brand: "Kingston",
  },
  {
    id: 7,
    name: "Intel Core i9-13900K",
    price: 45999,
    image: "./images/catalog_types/cpu.svg",
    category: "Процессоры",
    brand: "Intel",
  },
  {
    id: 8,
    name: "AMD Ryzen 7 7800X3D",
    price: 32999,
    image: "./images/catalog_types/cpu.svg",
    category: "Процессоры",
    brand: "AMD",
  },
];

// --- Состояние фильтров ---
let currentFilters = {
  category: "",
  brand: "",
  priceMin: "",
  priceMax: "",
};

// --- Функция для рендеринга продуктов ---
function renderProducts(productsArray) {
  const productsGrid = document.getElementById("productsGrid");
  if (!productsGrid) return; // Если контейнер не найден, выходим

  productsGrid.innerHTML = ""; // Очищаем контейнер

  if (productsArray.length === 0) {
    productsGrid.innerHTML =
      '<p class="no_products_message">Товары по заданным фильтрам не найдены.</p>';
    return;
  }

  productsArray.forEach((product) => {
    const productCard = document.createElement("div");
    productCard.className = "product_card";
    productCard.innerHTML = `
      <div class="product_image">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product_info">
        <h3 class="product_name">${product.name}</h3>
        <p class="product_price">${product.price} ₽</p>
        <button class="add_to_cart_btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
          Добавить в корзину
        </button>
      </div>
    `;
    productsGrid.appendChild(productCard);
  });

  // Добавляем обработчики событий для кнопок "Добавить в корзину"
  document.querySelectorAll(".add_to_cart_btn").forEach((button) => {
    button.addEventListener("click", addToCart);
  });
}

// --- Функция фильтрации ---
function filterProducts() {
  let filtered = products;

  // Фильтр по категории
  if (currentFilters.category) {
    filtered = filtered.filter(
      (product) => product.category === currentFilters.category
    );
  }

  // Фильтр по бренду
  if (currentFilters.brand) {
    filtered = filtered.filter(
      (product) => product.brand === currentFilters.brand
    );
  }

  // Фильтр по цене (от)
  if (currentFilters.priceMin !== "") {
    const min = parseFloat(currentFilters.priceMin);
    if (!isNaN(min)) {
      filtered = filtered.filter((product) => product.price >= min);
    }
  }

  // Фильтр по цене (до)
  if (currentFilters.priceMax !== "") {
    const max = parseFloat(currentFilters.priceMax);
    if (!isNaN(max)) {
      filtered = filtered.filter((product) => product.price <= max);
    }
  }

  renderProducts(filtered);
  updateActiveFiltersDisplay();
}

// --- Обновление отображения активных фильтров ---
function updateActiveFiltersDisplay() {
  const container = document.getElementById("activeFiltersContainer");
  const catSpan = document.getElementById("activeCategoryFilter");
  const brandSpan = document.getElementById("activeBrandFilter");
  const priceSpan = document.getElementById("activePriceFilter");

  const activeFilters = [];

  if (currentFilters.category) {
    catSpan.textContent = `Категория: ${currentFilters.category}`;
    activeFilters.push(catSpan);
  } else {
    catSpan.textContent = "";
  }

  if (currentFilters.brand) {
    brandSpan.textContent = `Производитель: ${currentFilters.brand}`;
    activeFilters.push(brandSpan);
  } else {
    brandSpan.textContent = "";
  }

  let priceText = "";
  if (currentFilters.priceMin !== "" || currentFilters.priceMax !== "") {
    const min = currentFilters.priceMin || "0";
    const max = currentFilters.priceMax || "∞";
    priceText = `Цена: ${min} - ${max} ₽`;
    priceSpan.textContent = priceText;
    activeFilters.push(priceSpan);
  } else {
    priceSpan.textContent = "";
  }

  if (activeFilters.length > 0) {
    container.style.display = "flex"; // Показываем контейнер
  } else {
    container.style.display = "none"; // Скрываем контейнер
  }
}

// --- Функция сброса фильтров ---
function clearAllFilters() {
  currentFilters = {
    category: "",
    brand: "",
    priceMin: "",
    priceMax: "",
  };

  // Сбросить значения в DOM
  document.getElementById("categoryFilter").value = "";
  document.getElementById("brandFilter").value = "";
  document.getElementById("priceMin").value = "";
  document.getElementById("priceMax").value = "";

  filterProducts(); // Применить фильтры (т.е. показать все)
}

// --- Инициализация страниц ---
document.addEventListener("DOMContentLoaded", function () {
  const catalogPage = document.getElementById("productsGrid");
  if (!catalogPage) return; // Если находимся не на catalog.html, выходим

  // --- Инициализация фильтров ---
  const categoryFilter = document.getElementById("categoryFilter");
  const brandFilter = document.getElementById("brandFilter");
  const priceMinInput = document.getElementById("priceMin");
  const priceMaxInput = document.getElementById("priceMax");
  const clearAllBtn = document.getElementById("clearAllFiltersBtn");

  if (categoryFilter) {
    categoryFilter.addEventListener("change", function () {
      currentFilters.category = this.value;
      filterProducts();
    });
  }

  if (brandFilter) {
    brandFilter.addEventListener("change", function () {
      currentFilters.brand = this.value;
      filterProducts();
    });
  }

  if (priceMinInput) {
    priceMinInput.addEventListener("input", function () {
      // Используем 'input' для более отзывчивого UI
      currentFilters.priceMin = this.value;
      filterProducts();
    });
  }

  if (priceMaxInput) {
    priceMaxInput.addEventListener("input", function () {
      currentFilters.priceMax = this.value;
      filterProducts();
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener("click", clearAllFilters);
  }

  // --- Обработка фильтрации при переходе с главной страницы ---
  // Проверяем URL-параметр 'category'
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get("category");

  if (initialCategory) {
    // Устанавливаем фильтр
    currentFilters.category = decodeURIComponent(initialCategory);
    // Обновляем select в DOM
    if (categoryFilter) {
      categoryFilter.value = currentFilters.category;
    }
  }

  // --- Запуск отображения ---
  filterProducts(); // Отображаем товары с учетом начальных фильтров (если есть)
});

// --- Функция добавления в корзину (осталась без изменений) ---
function addToCart(event) {
  const button = event.target;
  const productId = parseInt(button.dataset.id);
  const productName = button.dataset.name;
  const productPrice = parseInt(button.dataset.price);

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const existingProduct = cart.find((item) => item.id === productId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      id: productId,
      name: productName,
      price: productPrice,
      quantity: 1,
      image:
        products.find((p) => p.id === productId)?.image ||
        "./images/catalog_types/cpu.svg", // Добавляем изображение
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  alert(`Товар "${productName}" добавлен в корзину!`);
  updateCartCount();
}

// --- Функция для отображения корзины (осталась без изменений) ---
function renderCart() {
  const cartContent = document.getElementById("cartContent");
  if (!cartContent) return;

  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    cartContent.innerHTML = `
      <div class="empty_cart">
        <p>Ваша корзина пуста.</p>
        <a href="catalog.html" class="continue_shopping_btn">Продолжить покупки</a>
      </div>
    `;
    return;
  }

  let cartHTML = `
    <div class="cart_items">
      <div class="cart_header">
        <div class="cart_col">Товар</div>
        <div class="cart_col">Цена</div>
        <div class="cart_col">Количество</div>
        <div class="cart_col">Сумма</div>
        <div class="cart_col">Действия</div>
      </div>
  `;

  let totalAmount = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    totalAmount += itemTotal;

    cartHTML += `
      <div class="cart_item">
        <div class="cart_col cart_product">
          <img src="${item.image || "./images/catalog_types/cpu.svg"}" alt="${
      item.name
    }" class="cart_product_img">
          <span class="cart_product_name">${item.name}</span>
        </div>
        <div class="cart_col cart_price">${item.price} ₽</div>
        <div class="cart_col cart_quantity">
          <button class="quantity_btn minus" data-id="${item.id}">-</button>
          <span class="quantity_value">${item.quantity}</span>
          <button class="quantity_btn plus" data-id="${item.id}">+</button>
        </div>
        <div class="cart_col cart_total">${itemTotal} ₽</div>
        <div class="cart_col cart_action">
          <button class="remove_btn" data-id="${item.id}">Удалить</button>
        </div>
      </div>
    `;
  });

  cartHTML += `
    </div>
    <div class="cart_summary">
      <div class="cart_total_amount">
        <strong>Итого:</strong> ${totalAmount} ₽
      </div>
      <div class="cart_actions">
        <button class="checkout_btn" id="checkoutBtn">Оформить заказ</button>
        <button class="clear_cart_btn" id="clearCartBtn">Очистить корзину</button>
      </div>
    </div>
  `;

  cartContent.innerHTML = cartHTML;

  document.querySelectorAll(".quantity_btn.minus").forEach((button) => {
    button.addEventListener("click", decreaseQuantity);
  });

  document.querySelectorAll(".quantity_btn.plus").forEach((button) => {
    button.addEventListener("click", increaseQuantity);
  });

  document.querySelectorAll(".remove_btn").forEach((button) => {
    button.addEventListener("click", removeFromCart);
  });

  const checkoutBtn = document.getElementById("checkoutBtn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkout);

  const clearCartBtn = document.getElementById("clearCartBtn");
  if (clearCartBtn) clearCartBtn.addEventListener("click", clearCart);
}

// --- Функции управления корзиной (остались без изменений) ---
function decreaseQuantity(event) {
  const button = event.target;
  const productId = parseInt(button.dataset.id);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const product = cart.find((item) => item.id === productId);
  if (product) {
    if (product.quantity > 1) {
      product.quantity -= 1;
    } else {
      cart = cart.filter((item) => item.id !== productId);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

function increaseQuantity(event) {
  const button = event.target;
  const productId = parseInt(button.dataset.id);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  const product = cart.find((item) => item.id === productId);
  if (product) {
    product.quantity += 1;
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
  }
}

function removeFromCart(event) {
  const button = event.target;
  const productId = parseInt(button.dataset.id);
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  cart = cart.filter((item) => item.id !== productId);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function clearCart() {
  if (confirm("Вы уверены, что хотите очистить корзину?")) {
    localStorage.removeItem("cart");
    renderCart();
    updateCartCount();
  }
}

function checkout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  if (cart.length === 0) {
    alert("Ваша корзина пуста. Добавьте товары перед оформлением заказа.");
    return;
  }

  alert(
    "Заказ оформлен! В реальном проекте здесь бы происходила отправка данных на сервер."
  );
  localStorage.removeItem("cart");
  renderCart();
  updateCartCount();
}

document.addEventListener("DOMContentLoaded", function () {
  const cartContent = document.getElementById("cartContent");
  if (cartContent) {
    // Мы на странице cart.html
    renderCart(); // Вызываем отображение корзины
  }
  // Обратите внимание, что инициализация фильтров остается в старом блоке
  // и выполнится только на catalog.html
  const catalogPage = document.getElementById("productsGrid");
  if (!catalogPage) return; // Если это НЕ catalog.html, выходим из этой части

  // --- Код инициализации фильтров и т.д. остается здесь ---
  // (весь ваш существующий код из DDOMContentLoaded для catalog.html)
  // ...

  // --- Запуск отображения для catalog.html ---
  filterProducts(); // Отображаем товары с учетом начальных фильтров (если есть)
});
