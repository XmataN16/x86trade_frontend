document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return; // Если форма не найдена, выходим

  contactForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Предотвращаем отправку формы по умолчанию

    const fullName = document.getElementById("fullName").value.trim();
    const contactInfo = document.getElementById("contactInfo").value.trim();
    const message = document.getElementById("message").value.trim();

    // Простая валидация email или telegram/vk
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Регулярное выражение для Telegram (@username или https://t.me/username) или VK (https://vk.com/id123 или https://vk.com/username)
    const tgVkJRegex =
      /^(@[a-zA-Z0-9_]+|https?:\/\/(t\.me|vk\.com)\/[a-zA-Z0-9_]+)$/;

    if (!fullName) {
      alert("Пожалуйста, введите ваше ФИО.");
      return;
    }

    if (!contactInfo) {
      alert("Пожалуйста, введите email или ссылку на Telegram/VK.");
      return;
    }

    if (!emailRegex.test(contactInfo) && !tgVkJRegex.test(contactInfo)) {
      alert(
        "Пожалуйста, введите корректный email (например, example@mail.ru) или ссылку на Telegram/VK (например, @username или https://t.me/username)."
      );
      return;
    }

    if (!message) {
      alert("Пожалуйста, введите текст сообщения.");
      return;
    }

    // Если валидация прошла успешно
    alert("Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.");
    contactForm.reset(); // Очищаем форму
  });
});
