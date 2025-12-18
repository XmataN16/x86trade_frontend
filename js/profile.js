document.addEventListener("DOMContentLoaded", async () => {
  if (!api.isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }
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
});
