document.addEventListener("DOMContentLoaded", async function() {
  const vacanciesContainer = document.getElementById("vacanciesContainer");
  if (!vacanciesContainer) return;

  try {
    const vacancies = await api.apiGet("/api/vacancies");
    renderVacancies(vacanciesContainer, vacancies);
  } catch (err) {
    console.error("Error loading vacancies:", err);
    vacanciesContainer.innerHTML = `
      <div class="error_message">
        <p>Ошибка при загрузке вакансий. Пожалуйста, попробуйте позже.</p>
      </div>
    `;
  }
});

function renderVacancies(container, vacancies) {
  if (!vacancies || vacancies.length === 0) {
    container.innerHTML = `
      <div class="empty_vacancies">
        <p>В данный момент у нас нет открытых вакансий.</p>
        <p>Пожалуйста, проверяйте эту страницу позже.</p>
      </div>
    `;
    return;
  }

  let html = `<div class="vacancy_cards">`;
  
  vacancies.forEach(vacancy => {
    html += `
      <div class="vacancy_card">
        <h3 class="vacancy_position">${escapeHtml(vacancy.title)}</h3>
        
        <div class="vacancy_section">
          <h4 class="section_subtitle">Описание:</h4>
          <div class="vacancy_content">${formatText(vacancy.description)}</div>
        </div>
        
        <div class="vacancy_section">
          <h4 class="section_subtitle">Требования:</h4>
          <div class="vacancy_content">${formatText(vacancy.requirements)}</div>
        </div>
        
        <div class="vacancy_section">
          <h4 class="section_subtitle">Условия:</h4>
          <div class="vacancy_content">${formatText(vacancy.conditions)}</div>
        </div>
        
        <div class="vacancy_action">
          <a href="mailto:${escapeHtml(vacancy.contact_email)}" class="apply_button">
            Откликнуться на вакансию
          </a>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  container.innerHTML = html;
}

function formatText(text) {
  if (!text) return '';
  
  // Преобразуем переносы строк в <br>
  let formatted = text.replace(/\n/g, '<br>');
  
  // Преобразуем списки в формате * пункт в HTML списки
  formatted = formatted.replace(/\n\* (.+?)(?=(\n\* |\n|$))/g, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*?<\/li>)+/g, match => {
    return `<ul>${match}</ul>`;
  });
  
  return formatted;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[m]));
}