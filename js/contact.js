document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return; // Если форма не найдена, выходим

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault(); // Предотвращаем отправку формы по умолчанию

    const fullName = document.getElementById("fullName").value.trim();
    const contactInfo = document.getElementById("contactInfo").value.trim();
    const message = document.getElementById("message").value.trim();

    // Простая валидация email или telegram/vk
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const tgVkJRegex = /^(@[a-zA-Z0-9_]+|https?:\/\/(t\.me|vk\.com)\/[a-zA-Z0-9_]+)$/;

    if (!fullName) {
      showToast("Пожалуйста, введите ваше ФИО.", "error");
      return;
    }

    if (!contactInfo) {
      showToast("Пожалуйста, введите email или ссылку на Telegram/VK.", "error");
      return;
    }

    if (!emailRegex.test(contactInfo) && !tgVkJRegex.test(contactInfo)) {
      showToast(
        "Пожалуйста, введите корректный email (example@mail.ru) или ссылку на Telegram/VK (@username или https://t.me/username).",
        "error"
      );
      return;
    }

    if (!message) {
      showToast("Пожалуйста, введите текст сообщения.", "error");
      return;
    }

    try {
      const API_BASE = "http://localhost:8080";
      
      const response = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          contact_info: contactInfo,
          message: message
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.", "success");
        contactForm.reset();
      } else {
        showToast(data.message || "Ошибка при отправке сообщения.", "error");
      }
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
      showToast("Ошибка отправки сообщения: " + (err.message || err), "error");
    }
  });
});

// Функция для показа всплывающих уведомлений (toast)
function showToast(message, type) {
  // Создаем контейнер для тоста, если его еще нет
  if (!document.getElementById("toastContainer")) {
    const container = document.createElement("div");
    container.id = "toastContainer";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "10000";
    document.body.appendChild(container);
  }

  // Создаем сам тост
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.minWidth = "300px";
  toast.style.padding = "15px 20px";
  toast.style.borderRadius = "8px";
  toast.style.color = "white";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.marginBottom = "10px";
  toast.style.transform = "translateX(120%)";
  toast.style.transition = "transform 0.3s ease-out";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "12px";

  // Устанавливаем цвета в зависимости от типа
  const colors = {
    success: "#28a745",
    error: "#dc3545",
    info: "#17a2b8",
    warning: "#ffc107"
  };

  toast.style.backgroundColor = colors[type] || colors.info;

  // Добавляем иконку
  const icon = document.createElement("div");
  icon.style.fontSize = "20px";
  icon.style.fontWeight = "bold";

  switch(type) {
    case 'success':
      icon.innerHTML = '✓';
      break;
    case 'error':
      icon.innerHTML = '✗';
      break;
    case 'warning':
      icon.innerHTML = '!';
      break;
    default:
      icon.innerHTML = 'i';
  }

  // Добавляем сообщение
  const messageEl = document.createElement("div");
  messageEl.textContent = message;
  messageEl.style.flex = "1";

  // Добавляем кнопку закрытия
  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = '&times;';
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "white";
  closeBtn.style.fontSize = "20px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.padding = "0 5px";
  closeBtn.addEventListener("click", () => {
    toast.style.transform = "translateX(120%)";
    setTimeout(() => toast.remove(), 300);
  });

  toast.appendChild(icon);
  toast.appendChild(messageEl);
  toast.appendChild(closeBtn);
  document.getElementById("toastContainer").appendChild(toast);

  // Показываем уведомление
  setTimeout(() => {
    toast.style.transform = "translateX(0)";
  }, 10);

  // Автоматическое скрытие через 3 секунды
  setTimeout(() => {
    toast.style.transform = "translateX(120%)";
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 3000);
}