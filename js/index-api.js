// js/index-api.js
document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("categoriesContainer");
  if (!container) return;
  try {
    const categories = await apiGet("/api/categories");
    container.innerHTML = "";
    categories.forEach(cat => {
      const card = document.createElement("div");
      card.className = "catalog_types_card";
      card.innerHTML = `
        <div class="catalog_types_card_top">
          <a href="catalog.html?category_id=${cat.id}" class="catalog_types_card_img">
            <img src="./images/catalog_types/cpu.svg" alt="${cat.name}" />
          </a>
        </div>
        <div class="catalog_types_card_bottom">
          <a href="catalog.html?category_id=${cat.id}" class="catalog_types_card_title">${cat.name}</a>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
    container.innerHTML = "<p>Не удалось загрузить категории</p>";
  }
});
