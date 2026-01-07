// js/api.js
const API_BASE = "https://x86trade-backend.onrender.com"; // поменяй если бэк на другом хосте/порту

// Получить токены из localStorage
function getAccessToken() {
  return localStorage.getItem("access_token");
}
function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}
function saveTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem("access_token", access_token);
  if (refresh_token) localStorage.setItem("refresh_token", refresh_token);
}
function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// Внутренняя функция: попытка обновить access token по refresh token
async function tryRefreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(API_BASE + "/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) {
      // удалим старый refresh token, он не действителен
      clearTokens();
      return false;
    }
    const data = await res.json();
    if (data.access_token) {
      saveTokens({ access_token: data.access_token });
      return true;
    }
    return false;
  } catch (err) {
    console.error("refresh error", err);
    return false;
  }
}

// Универсальная обёртка для fetch с автоматическим retry при 401 (попытка refresh)
async function apiFetch(method, path, body = null, params = {}) {
  const url = new URL(API_BASE + path);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });

  async function doFetch() {
    const headers = {};
    let payload = undefined;
    if (body !== null) {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
    const token = getAccessToken();
    if (token) headers["Authorization"] = "Bearer " + token;

    const res = await fetch(url.toString(), {
      method,
      headers,
      body: payload,
      // credentials: "include" // не требуется для токенов; включай если используешь cookies
    });
    return res;
  }

  let res = await doFetch();
  if (res.status === 401) {
    // попробуем обновить токен и повторить
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const message = text || `${res.status} ${res.statusText}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  // Попробуем вернуть JSON, если он есть
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

// Удобные функции
async function apiGet(path, params = {}) {
  return await apiFetch("GET", path, null, params);
}
async function apiPost(path, body = {}, params = {}) {
  return await apiFetch("POST", path, body, params);
}
async function apiPut(path, body = {}, params = {}) {
  return await apiFetch("PUT", path, body, params);
}
async function apiDelete(path, params = {}) {
  return await apiFetch("DELETE", path, null, params);
}

// Auth helpers
async function authRegister(email, password, firstName = "", lastName = "") {
  return await apiPost("/api/auth/register", { email, password, first_name: firstName, last_name: lastName });
}

async function authLogin(email, password) {
  // возвращает { access_token, refresh_token, ... }
  const res = await apiPost("/api/auth/login", { email, password });
  if (res.access_token) saveTokens({ access_token: res.access_token, refresh_token: res.refresh_token });
  return res;
}

async function authLogout() {
  const refresh = getRefreshToken();
  try {
    if (refresh) {
      await apiPost("/api/auth/logout", { refresh_token: refresh });
    }
  } catch (e) {
    // ignore server errors on logout
    console.warn("logout error", e);
  }
  clearTokens();
}

// Экспорт небольшого API в глобал для других модулей
window.api = {
  apiGet, apiPost, apiPut, apiDelete,
  authRegister, authLogin, authLogout,
  isAuthenticated: () => !!getAccessToken()
};