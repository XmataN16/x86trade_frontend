// js/api.js
const API_BASE = "http://localhost:8080"; // если бэк на другом порту — поменяй

async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path);
  for (const k in params) {
    if (params[k] !== undefined && params[k] !== null && params[k] !== "") {
      url.searchParams.append(k, params[k]);
    }
  }
  const res = await fetch(url.toString(), { credentials: "same-origin" });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return await res.json();
}
