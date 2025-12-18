// js/common.js — упрощённая, рабочая версия

// ========== Утилиты ==========
function escapeHtml(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/[&<>"']/g, function (m) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]);
  });
}

// ========== Clock ==========
function updateTime() {
  const now = new Date();
  const options = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
  const timeString = now.toLocaleTimeString("ru-RU", options);
  const timeElement = document.getElementById("current-time");
  if (timeElement) timeElement.textContent = timeString;
}
let timeIntervalId;
function startClock() {
  if (!timeIntervalId) {
    updateTime();
    timeIntervalId = setInterval(updateTime, 1000);
  }
}

// ========== Burger menu ==========
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

// ========== Cart badge ==========
function renderCartBadge(totalItems) {
  const cartAnchor = document.querySelector('.cart-container') || document.querySelector('.user-actions_link.cart-container');
  if (!cartAnchor) return;
  const existing = cartAnchor.querySelector(".cart-badge");
  if (existing) existing.remove();
  if (totalItems > 0) {
    const badge = document.createElement("span");
    badge.className = "cart-badge";
    badge.textContent = totalItems;
    cartAnchor.appendChild(badge);
  }
}

// unified updateCartCount (server-aware)
async function updateCartCount() {
  try {
    if (window.api && typeof window.api.isAuthenticated === "function" && window.api.isAuthenticated()) {
      const items = await window.api.apiGet("/api/cart");
      const totalItems = (items || []).reduce((s, it) => s + (it.quantity || 0), 0);
      renderCartBadge(totalItems);
      return;
    }
  } catch (e) {
    console.warn("Failed to load cart count from server", e);
  }
  // fallback guest cart
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const total = cart.reduce((s, it) => s + (it.quantity || 0), 0);
  renderCartBadge(total);
}

// ========== Auth modal (exposed) ==========
window.showAuthModal = function (tab = "login") {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.add("visible");
  const login = document.getElementById("authLoginForm");
  const reg = document.getElementById("authRegisterForm");
  if (login && reg) {
    login.style.display = (tab === "login") ? "" : "none";
    reg.style.display = (tab === "register") ? "" : "none";
  }
};

window.hideAuthModal = function () {
  const modal = document.getElementById("authModal");
  if (!modal) return;
  modal.classList.remove("visible");
};

// ========== Auth UI (profile icon / dropdown) ==========
function createProfileDropdown(container) {
  // remove old if exists
  const old = container.querySelector("#profileDropdown");
  if (old) old.remove();

  const menu = document.createElement("div");
  menu.id = "profileDropdown";
  menu.className = "profile-dropdown";
  menu.innerHTML = `
    <a href="profile.html" class="profile-dropdown-item">Личный кабинет</a>
    <a href="#" id="logoutBtn" class="profile-dropdown-item">Выйти</a>
  `;
  // ensure container is positioned relatively so absolute dropdown works
  container.style.position = container.style.position || "relative";
  container.appendChild(menu);

  menu.classList.remove("visible"); // hidden initially
  return menu;
}

function updateAuthUI() {
  const container = document.querySelector(".profile-container");
  if (!container) return;
  container.innerHTML = ""; // clear content

  const isAuth = window.api && typeof window.api.isAuthenticated === "function" && window.api.isAuthenticated();

  if (isAuth) {
    // show icon + dropdown (toggle on click)
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "profile-btn";
    btn.innerHTML = `<img src="images/user.svg" alt="Профиль" class="profile-icon"><span class="tooltip">Профиль</span>`;
    container.appendChild(btn);

    const menu = createProfileDropdown(container);

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      menu.classList.toggle("visible");
    });

    // logout handler
    const logoutBtn = menu.querySelector("#logoutBtn");
    logoutBtn.addEventListener("click", async function (ev) {
      ev.preventDefault();
      try { await window.api.authLogout(); } catch (err) { console.warn("logout error", err); }
      // clear tokens anyway
      try { localStorage.removeItem("access_token"); localStorage.removeItem("refresh_token"); } catch {}
      updateAuthUI();
      updateCartCount();
      menu.classList.remove("visible");
      window.location.href = "index.html";
    });

    // click outside closes menu
    document.addEventListener("click", function outsideListener(ev) {
      if (!container.contains(ev.target)) {
        menu.classList.remove("visible");
      }
    });

  } else {
    // not auth: show icon that opens modal on click
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "profile-btn";
    btn.innerHTML = `<img src="images/user.svg" alt="Войти" class="profile-icon"><span class="tooltip">Войти</span>`;
    container.appendChild(btn);

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      window.showAuthModal("login");
    });
  }
}

// ========== Modal init and forms ==========
function initAuthModal() {
  const modal = document.getElementById("authModal");
  if (!modal) return;

  document.getElementById("authModalClose")?.addEventListener("click", window.hideAuthModal);
  document.getElementById("showLogin")?.addEventListener("click", () => window.showAuthModal("login"));
  document.getElementById("showRegister")?.addEventListener("click", () => window.showAuthModal("register"));

  // login form
  const loginForm = document.getElementById("modalLoginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (document.getElementById("modalLoginEmail") || {}).value || "";
      const pw = (document.getElementById("modalLoginPassword") || {}).value || "";
      try {
        await window.api.authLogin(email, pw);
        window.hideAuthModal();
        updateAuthUI();
        updateCartCount();
      } catch (err) {
        alert("Ошибка входа: " + (err.message || err));
      }
    });
  }

  // register form
  const regForm = document.getElementById("modalRegisterForm");
  if (regForm) {
    regForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = (document.getElementById("modalRegEmail") || {}).value || "";
      const pw = (document.getElementById("modalRegPassword") || {}).value || "";
      const fn = (document.getElementById("modalRegFirstName") || {}).value || "";
      const ln = (document.getElementById("modalRegLastName") || {}).value || "";
      try {
        await window.api.authRegister(email, pw, fn, ln);
        alert("Успешно зарегистрированы. Выполните вход.");
        window.showAuthModal("login");
      } catch (err) {
        alert("Ошибка регистрации: " + (err.message || err));
      }
    });
  }
}

// ========== Dom ready ==========
document.addEventListener("DOMContentLoaded", function () {
  initBurgerMenu();
  startClock();
  initAuthModal();
  updateAuthUI();
  updateCartCount();
});
