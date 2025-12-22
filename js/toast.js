// js/toast.js
function createToast(message, type = 'success') {
  // Удаляем предыдущие уведомления
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Создаем контейнер для уведомлений, если его нет
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.position = 'fixed';
    toastContainer.style.top = '20px';
    toastContainer.style.right = '20px';
    toastContainer.style.zIndex = '10000';
    toastContainer.style.display = 'flex';
    toastContainer.style.flexDirection = 'column';
    toastContainer.style.gap = '10px';
    document.body.appendChild(toastContainer);
  }
  
  // Создаем уведомление
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.style.minWidth = '300px';
  toast.style.padding = '15px 20px';
  toast.style.borderRadius = '8px';
  toast.style.color = 'white';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.gap = '12px';
  toast.style.transform = 'translateX(120%)';
  toast.style.transition = 'transform 0.3s ease-out';
  
  // Устанавливаем цвета в зависимости от типа
  const colors = {
    success: '#28a745',
    error: '#dc3545',
    info: '#17a2b8',
    warning: '#ffc107'
  };
  
  toast.style.backgroundColor = colors[type] || colors.info;
  
  // Добавляем иконку
  const icon = document.createElement('div');
  icon.style.fontSize = '20px';
  icon.style.fontWeight = 'bold';
  
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
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  messageEl.style.flex = '1';
  
  // Добавляем кнопку закрытия
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&times;';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.color = 'white';
  closeBtn.style.fontSize = '20px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '0 5px';
  closeBtn.addEventListener('click', () => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => toast.remove(), 300);
  });
  
  toast.appendChild(icon);
  toast.appendChild(messageEl);
  toast.appendChild(closeBtn);
  toastContainer.appendChild(toast);
  
  // Показываем уведомление
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);
  
  // Автоматическое скрытие через 3 секунды
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 300);
  }, 3000);
  
  return toast;
}

// Экспортируем в глобальную область видимости
window.toast = {
  success: (message) => createToast(message, 'success'),
  error: (message) => createToast(message, 'error'),
  info: (message) => createToast(message, 'info'),
  warning: (message) => createToast(message, 'warning')
};