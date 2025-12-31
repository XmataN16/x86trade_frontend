(function() {
    // Глобальные переменные для пагинации
    const pageSizes = {
        products: 10,
        categories: 10,
        users: 10,
        manufacturers: 10,
        'delivery-methods': 10,
        'payment-methods': 10,
        vacancies: 10,
        characteristics: 10,
        orders: 10
    };
    
    let currentPage = {
        products: 1,
        categories: 1,
        users: 1,
        manufacturers: 1,
        'delivery-methods': 1,
        'payment-methods': 1,
        vacancies: 1,
        characteristics: 1,
        orders: 1
    };
    
    // Кэш для выпадающих списков (категории, производители)
    let categoriesCache = [];
    let manufacturersCache = [];
    
    // Флаги для предотвращения многократной загрузки кэша
    let isCategoriesCacheLoading = false;
    let isManufacturersCacheLoading = false;
    
    // Проверка прав администратора
    async function checkAdminAccess() {
        try {
            if (!api.isAuthenticated()) {
                window.location.href = "login.html";
                return false;
            }
            
            const user = await api.apiGet("/api/auth/me");
            if (!user || !user.is_admin) {
                toast.error("У вас нет прав доступа к админ-панели");
                window.location.href = "index.html";
                return false;
            }
            return true;
        } catch (err) {
            console.error("checkAdminAccess:", err);
            window.location.href = "login.html";
            return false;
        }
    }
    
    // Инициализация навигации по разделам
    function initNavigation() {
        document.querySelectorAll(".admin-menu .menu-item").forEach(item => {
            item.addEventListener("click", function(e) {
                e.preventDefault();
                document.querySelectorAll(".admin-menu .menu-item").forEach(i => i.classList.remove("active"));
                this.classList.add("active");
                document.querySelectorAll(".admin-section-content").forEach(section => section.classList.remove("active"));
                const sectionId = "admin-section-" + this.dataset.section;
                const el = document.getElementById(sectionId);
                if (el) el.classList.add("active");
                // Загружаем данные для раздела
                loadSectionData(this.dataset.section);
            });
        });
    }
    
    // Загрузка данных для раздела
    async function loadSectionData(section) {
        try {
            switch(section) {
                case "products":
                    await loadProducts();
                    break;
                case "categories":
                    await loadCategories();
                    break;
                case "users":
                    await loadUsers();
                    break;
                case "manufacturers":
                    await loadManufacturers();
                    break;
                case "delivery-methods":
                    await loadDeliveryMethods();
                    break;
                case "payment-methods":
                    await loadPaymentMethods();
                    break;
                case "vacancies":
                    await loadVacancies();
                    break;
                case "characteristics":
                    await loadCharacteristics();
                    break;
                case "orders":
                    await loadOrders();
                    break;
                case "dashboard":
                    await loadDashboard();
                    break;
            }
        } catch (err) {
            console.error("loadSectionData error", err);
            toast.error("Ошибка загрузки данных раздела");
        }
    }
    
    // Загрузка дашборда
    async function loadDashboard() {
        try {
            // Получаем статистику
            const usersResp = await api.apiGet("/api/admin/users");
            const productsResp = await api.apiGet("/api/admin/products");
            const ordersResp = await api.apiGet("/api/admin/orders");
            
            const stats = {
                users: Array.isArray(usersResp) ? usersResp : (usersResp.data || []),
                products: Array.isArray(productsResp) ? productsResp : (productsResp.data || []),
                orders: Array.isArray(ordersResp) ? ordersResp : (ordersResp.data || [])
            };
            
            // Обновляем статистику
            document.getElementById("active-users").textContent = stats.users.filter(u => u.is_active).length;
            document.getElementById("new-orders").textContent = stats.orders.filter(o => o.status === 'created').length;
            document.getElementById("available-products").textContent = stats.products.filter(p => p.stock_quantity > 0).length;
            document.getElementById("monthly-revenue").textContent = "0 ₽"; // Заглушка, в реальности нужно считать по заказам за месяц
            
            // Обновляем общую статистику
            document.getElementById("total-users").textContent = stats.users.length;
            document.getElementById("total-products").textContent = stats.products.length;
            document.getElementById("total-orders").textContent = stats.orders.length;
            
            // Загружаем последние заказы
            const recentOrdersEl = document.getElementById("recent-orders");
            const recentOrders = stats.orders.slice(0, 5);
            if (recentOrders.length === 0) {
                recentOrdersEl.innerHTML = "<tr><td colspan='5' class='no-data'>Нет заказов</td></tr>";
            } else {
                recentOrdersEl.innerHTML = recentOrders.map(order => `
                    <tr>
                        <td>${order.id}</td>
                        <td>${order.user_name || 'Пользователь'}</td>
                        <td>${Number(order.total_amount).toFixed(2)} ₽</td>
                        <td>${formatOrderStatus(order.status)}</td>
                        <td>${formatDate(order.created_at)}</td>
                    </tr>
                `).join('');
            }
            
            // Загружаем новых пользователей
            const recentUsersEl = document.getElementById("recent-users");
            const recentUsers = stats.users.slice(0, 5);
            if (recentUsers.length === 0) {
                recentUsersEl.innerHTML = "<tr><td colspan='4' class='no-data'>Нет пользователей</td></tr>";
            } else {
                recentUsersEl.innerHTML = recentUsers.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.first_name} ${user.last_name}</td>
                        <td>${user.email}</td>
                        <td>${formatDate(user.created_at)}</td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.error("Error loading dashboard:", err);
            toast.error("Ошибка загрузки дашборда");
        }
    }
    
    // Функция для экранирования HTML
    function escapeHtml(str = "") {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Форматирование даты
    function formatDate(dateString) {
        if (!dateString) return "-";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateString;
        }
    }
    
    // Форматирование цены
    function formatPrice(price) {
        if (!price && price !== 0) return "-";
        return Number(price).toFixed(2) + " ₽";
    }
    
    // Форматирование статуса заказа
    function formatOrderStatus(status) {
        const statuses = {
            'created': 'Создан',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status.toLowerCase()] || status;
    }
    
    // Загрузка товаров
    async function loadProducts() {
        const tbody = document.getElementById("products-table-body");
        if (!tbody) return;
        
        // Показываем индикатор загрузки
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка товаров...</p>
                </td>
            </tr>
        `;
        
        try {
            // Подгружаем категории и производителей для кэша (для выпадающих списков при редактировании)
            await Promise.all([
                loadCategoriesForCache(),
                loadManufacturersForCache()
            ]);
            
            const response = await api.apiGet("/api/admin/products");
            const products = Array.isArray(response) ? response : (response.data || []);
            renderProductsTable(products);
        } catch (err) {
            console.error("Error loading products:", err);
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">Ошибка загрузки товаров: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки товаров");
        }
    }
    
    // Отрисовка таблицы товаров
    function renderProductsTable(products) {
        const tbody = document.getElementById("products-table-body");
        if (!tbody) return;
        
        if (!products || products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">Товары не найдены</td></tr>`;
            return;
        }
        
        let html = '';
        products.forEach(product => {
            html += `
                <tr data-id="${product.id}">
                    <td class="editable name" data-field="name" data-value="${escapeHtml(product.name)}">${escapeHtml(product.name)}</td>
                    <td class="editable description" data-field="description" data-value="${escapeHtml(product.description || '')}">${escapeHtml(product.description || '')}</td>
                    <td class="editable sku" data-field="sku" data-value="${escapeHtml(product.sku || '')}">${escapeHtml(product.sku || '')}</td>
                    <td class="editable price" data-field="price" data-value="${product.price}">${formatPrice(product.price)}</td>
                    <td class="editable category" data-field="category_id" data-value="${product.category_id || ''}">
                        ${getCategoryNameById(product.category_id) || 'Не выбрано'}
                    </td>
                    <td class="editable manufacturer" data-field="manufacturer_id" data-value="${product.manufacturer_id || ''}">
                        ${getManufacturerNameById(product.manufacturer_id) || 'Не выбрано'}
                    </td>
                    <td class="editable image_path" data-field="image_path" data-value="${escapeHtml(product.image_path)}">${escapeHtml(product.image_path)}</td>
                    <td class="editable stock_quantity" data-field="stock_quantity" data-value="${product.stock_quantity || 0}">${product.stock_quantity || 0}</td>
                    <td class="row-actions">
                        <button class="btn table-action edit" title="Редактировать">
                            <span class="tooltip">Редактировать</span>
                            ✏️
                        </button>
                        <button class="btn table-action delete" title="Удалить" data-id="${product.id}">
                            <span class="tooltip">Удалить</span>
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
        // Добавляем обработчики событий
        addTableEventListeners();
    }
    
    // Загрузка категорий для кэша
    async function loadCategoriesForCache() {
        if (isCategoriesCacheLoading || categoriesCache.length > 0) return;
        
        isCategoriesCacheLoading = true;
        try {
            const response = await api.apiGet("/api/admin/categories");
            categoriesCache = Array.isArray(response) ? response : (response.data || []);
        } catch (err) {
            console.error("Error loading categories for cache:", err);
        } finally {
            isCategoriesCacheLoading = false;
        }
    }
    
    // Получение имени категории по ID
    function getCategoryNameById(id) {
        if (!id) return null;
        const category = categoriesCache.find(c => c.id == id);
        return category ? category.name : null;
    }
    
    // Загрузка производителей для кэша
    async function loadManufacturersForCache() {
        if (isManufacturersCacheLoading || manufacturersCache.length > 0) return;
        
        isManufacturersCacheLoading = true;
        try {
            const response = await api.apiGet("/api/admin/manufacturers");
            manufacturersCache = Array.isArray(response) ? response : (response.data || []);
        } catch (err) {
            console.error("Error loading manufacturers for cache:", err);
        } finally {
            isManufacturersCacheLoading = false;
        }
    }
    
    // Получение имени производителя по ID
    function getManufacturerNameById(id) {
        if (!id) return null;
        const manufacturer = manufacturersCache.find(m => m.id == id);
        return manufacturer ? manufacturer.name : null;
    }
    
    // Загрузка категорий
    async function loadCategories() {
        const tbody = document.getElementById("categories-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка категорий...</p>
                </td>
            </tr>
        `;
        
        try {
            const response = await api.apiGet("/api/admin/categories");
            const categories = Array.isArray(response) ? response : (response.data || []);
            renderCategoriesTable(categories);
        } catch (err) {
            console.error("Error loading categories:", err);
            tbody.innerHTML = `<tr><td colspan="5" class="no-data">Ошибка загрузки категорий: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки категорий");
        }
    }
    
    // Отрисовка таблицы категорий
    function renderCategoriesTable(categories) {
        const tbody = document.getElementById("categories-table-body");
        if (!tbody) return;
        
        if (!categories || categories.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="no-data">Категории не найдены</td></tr>`;
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            html += `
                <tr data-id="${category.id}">
                    <td class="editable name" data-field="name" data-value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</td>
                    <td class="editable description" data-field="description" data-value="${escapeHtml(category.description || '')}">${escapeHtml(category.description || '')}</td>
                    <td class="editable slug" data-field="slug" data-value="${escapeHtml(category.slug)}">${escapeHtml(category.slug)}</td>
                    <td class="row-actions">
                        <button class="btn table-action edit" title="Редактировать">
                            <span class="tooltip">Редактировать</span>
                            ✏️
                        </button>
                        <button class="btn table-action delete" title="Удалить" data-id="${category.id}">
                            <span class="tooltip">Удалить</span>
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        addTableEventListeners();
    }
    
    // Загрузка пользователей
async function loadUsers() {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="9" class="loader-container">
                <div class="spinner"></div>
                <p>Загрузка пользователей...</p>
            </td>
        </tr>
    `;
    
    try {
        const response = await api.apiGet("/api/admin/users");
        const users = Array.isArray(response) ? response : (response.data || []);
        renderUsersTable(users);
    } catch (err) {
        console.error("Error loading users:", err);
        tbody.innerHTML = `<tr><td colspan="9" class="no-data">Ошибка загрузки пользователей: ${err.message || err}</td></tr>`;
        toast.error("Ошибка загрузки пользователей");
    }
}
    
    // Отрисовка таблицы пользователей
function renderUsersTable(users) {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    
    if (!users || users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="no-data">Пользователи не найдены</td></tr>`;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        html += `
            <tr data-id="${user.id}">
                <td class="editable first_name" data-field="first_name" data-value="${escapeHtml(user.first_name)}">${escapeHtml(user.first_name)}</td>
                <td class="editable last_name" data-field="last_name" data-value="${escapeHtml(user.last_name)}">${escapeHtml(user.last_name)}</td>
                <td class="editable mid_name" data-field="mid_name" data-value="${escapeHtml(user.mid_name || '')}">${escapeHtml(user.mid_name || '')}</td>
                <td class="editable email" data-field="email" data-value="${escapeHtml(user.email)}">${escapeHtml(user.email)}</td>
                <td class="editable phone" data-field="phone" data-value="${escapeHtml(user.phone || '')}">${escapeHtml(user.phone || '')}</td>
                <td class="editable is_admin" data-field="is_admin" data-value="${user.is_admin}">
                    ${user.is_admin ? 'Администратор' : 'Пользователь'}
                </td>
                <td class="editable created_at" data-field="created_at" data-value="${user.created_at}">${formatDate(user.created_at)}</td>
                <td class="row-actions">
                    <button class="btn table-action edit" title="Редактировать">
                        <span class="tooltip">Редактировать</span>
                        ✏️
                    </button>
                    <button class="btn table-action password" title="Сменить пароль" data-id="${user.id}">
                        <span class="tooltip">Сменить пароль</span>
                        🔑
                    </button>
                    <button class="btn table-action delete" title="Удалить" data-id="${user.id}">
                        <span class="tooltip">Удалить</span>
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    addTableEventListeners();
}
    
    // Загрузка производителей
    async function loadManufacturers() {
        const tbody = document.getElementById("manufacturers-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка производителей...</p>
                </td>
            </tr>
        `;
        
        try {
            const response = await api.apiGet("/api/admin/manufacturers");
            const manufacturers = Array.isArray(response) ? response : (response.data || []);
            renderManufacturersTable(manufacturers);
        } catch (err) {
            console.error("Error loading manufacturers:", err);
            tbody.innerHTML = `<tr><td colspan="5" class="no-data">Ошибка загрузки производителей: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки производителей");
        }
    }
    
    // Отрисовка таблицы производителей
    function renderManufacturersTable(manufacturers) {
        const tbody = document.getElementById("manufacturers-table-body");
        if (!tbody) return;
        
        if (!manufacturers || manufacturers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="no-data">Производители не найдены</td></tr>`;
            return;
        }
        
        let html = '';
        manufacturers.forEach(manufacturer => {
            html += `
                <tr data-id="${manufacturer.id}">
                    <td class="editable name" data-field="name" data-value="${escapeHtml(manufacturer.name)}">${escapeHtml(manufacturer.name)}</td>
                    <td class="editable country" data-field="country" data-value="${escapeHtml(manufacturer.country || '')}">${escapeHtml(manufacturer.country || '')}</td>
                    <td class="editable website" data-field="website" data-value="${escapeHtml(manufacturer.website || '')}">${escapeHtml(manufacturer.website || '')}</td>
                    <td class="row-actions">
                        <button class="btn table-action edit" title="Редактировать">
                            <span class="tooltip">Редактировать</span>
                            ✏️
                        </button>
                        <button class="btn table-action delete" title="Удалить" data-id="${manufacturer.id}">
                            <span class="tooltip">Удалить</span>
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        addTableEventListeners();
    }
    
    // Загрузка способов доставки
    async function loadDeliveryMethods() {
        const tbody = document.getElementById("delivery-methods-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка способов доставки...</p>
                </td>
            </tr>
        `;
        
        try {
            const response = await api.apiGet("/api/admin/delivery_methods");
            const methods = Array.isArray(response) ? response : (response.data || []);
            renderDeliveryMethodsTable(methods);
        } catch (err) {
            console.error("Error loading delivery methods:", err);
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">Ошибка загрузки способов доставки: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки способов доставки");
        }
    }
    
    // Функция для безопасного получения значений из SQL null-полей
function getSQLValue(field) {
    if (!field) return null;
    
    // Обработка sql.NullString
    if (field.String !== undefined && field.Valid !== undefined) {
        return field.Valid ? field.String : null;
    }
    
    // Обработка sql.NullFloat64
    if (field.Float64 !== undefined && field.Valid !== undefined) {
        return field.Valid ? field.Float64 : null;
    }
    
    // Обработка sql.NullInt64
    if (field.Int64 !== undefined && field.Valid !== undefined) {
        return field.Valid ? field.Int64 : null;
    }
    
    return field;
}

// Форматирование цены для отображения
function formatPrice(price) {
    if (!price && price !== 0) return "—";
    if (typeof price === 'object' && price.Float64 !== undefined && price.Valid) {
        price = price.Float64;
    }
    return Number(price).toFixed(2) + " ₽";
}

    // Отрисовка таблицы способов доставки
// Функция для отображения способов доставки
function renderDeliveryMethodsTable(methods) {
    const tbody = document.getElementById("delivery-methods-table-body");
    if (!tbody) return;
    
    if (!methods || methods.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="no-data">Способы доставки не найдены</td></tr>`;
        return;
    }
    
    let html = '';
    methods.forEach(method => {
        // Безопасное форматирование описания
        const description = getSQLValue(method.description) || '—';
        
        // Безопасное форматирование порога бесплатной доставки
        const freeThreshold = method.free_threshold && method.free_threshold.Valid
            ? formatPrice(method.free_threshold.Float64)
            : '—';
        
        // Безопасное форматирование срока доставки
        const estimatedDays = method.estimated_days && method.estimated_days.Valid
            ? method.estimated_days.Int64
            : '—';
        
        // Безопасное форматирование базовой стоимости
        const baseCost = method.base_cost !== undefined
            ? formatPrice(method.base_cost)
            : '—';
        
        html += `
            <tr data-id="${method.id}">
                <td class="editable name" data-field="name" data-value="${escapeHtml(method.name)}">${escapeHtml(method.name)}</td>
                <td class="editable description" data-field="description" data-value="${escapeHtml(description)}">${escapeHtml(description)}</td>
                <td class="editable base_cost" data-field="base_cost" data-value="${method.base_cost || 0}">${baseCost}</td>
                <td class="editable free_threshold" data-field="free_threshold" data-value="${method.free_threshold && method.free_threshold.Valid ? method.free_threshold.Float64 : ''}">${freeThreshold}</td>
                <td class="editable estimated_days" data-field="estimated_days" data-value="${method.estimated_days && method.estimated_days.Valid ? method.estimated_days.Int64 : ''}">${estimatedDays}</td>
                <td class="row-actions">
                    <button class="btn table-action edit" title="Редактировать">
                        <span class="tooltip">Редактировать</span>
                        ✏️
                    </button>
                    <button class="btn table-action delete" title="Удалить" data-id="${method.id}">
                        <span class="tooltip">Удалить</span>
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    addTableEventListeners();
}
    
    // Загрузка способов оплаты
    async function loadPaymentMethods() {
        const tbody = document.getElementById("payment-methods-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка способов оплаты...</p>
                </td>
            </tr>
        `;
        
        try {
            const response = await api.apiGet("/api/admin/payment_methods");
            const methods = Array.isArray(response) ? response : (response.data || []);
            renderPaymentMethodsTable(methods);
        } catch (err) {
            console.error("Error loading payment methods:", err);
            tbody.innerHTML = `<tr><td colspan="5" class="no-data">Ошибка загрузки способов оплаты: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки способов оплаты");
        }
    }
    
    // Отрисовка таблицы способов оплаты
    function renderPaymentMethodsTable(methods) {
        const tbody = document.getElementById("payment-methods-table-body");
        if (!tbody) return;
        
        if (!methods || methods.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="no-data">Способы оплаты не найдены</td></tr>`;
            return;
        }
        
        let html = '';
        methods.forEach(method => {
            // Обработка описания
            let description = method.description;
            if (description && typeof description === 'object') {
                description = description.String || description.text || description.value || JSON.stringify(description);
            }
            
            html += `
                <tr data-id="${method.id}">
                    <td class="editable name" data-field="name" data-value="${escapeHtml(method.name)}">${escapeHtml(method.name)}</td>
                    <td class="editable description" data-field="description" data-value="${escapeHtml(description || '')}">${escapeHtml(description || '')}</td>
                    <td class="editable is_active" data-field="is_active" data-value="${method.is_active}">
                        ${method.is_active ? 'Да' : 'Нет'}
                    </td>
                    <td class="row-actions">
                        <button class="btn table-action edit" title="Редактировать">
                            <span class="tooltip">Редактировать</span>
                            ✏️
                        </button>
                        <button class="btn table-action delete" title="Удалить" data-id="${method.id}">
                            <span class="tooltip">Удалить</span>
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        addTableEventListeners();
    }

    // Функция для получения данных способа доставки при сохранении
function getDeliveryMethodData(row) {
    const cells = row.querySelectorAll('.editable');
    const data = {};
    
    cells.forEach(cell => {
        const field = cell.dataset.field;
        const input = cell.querySelector('.inline-edit, .inline-select');
        if (!input) return;
        
        const value = input.value.trim();
        
        switch(field) {
            case 'base_cost':
                data[field] = value ? parseFloat(value) : 0;
                break;
            case 'free_threshold':
                if (value) {
                    data[field] = {Float64: parseFloat(value), Valid: true};
                } else {
                    data[field] = {Valid: false};
                }
                break;
            case 'estimated_days':
                if (value) {
                    data[field] = {Int64: parseInt(value), Valid: true};
                } else {
                    data[field] = {Valid: false};
                }
                break;
            case 'description':
                if (value) {
                    data[field] = {String: value, Valid: true};
                } else {
                    data[field] = {Valid: false};
                }
                break;
            default:
                data[field] = value;
        }
    });
    
    return data;
}

// Функция сохранения строки для способов доставки
async function saveDeliveryMethodRow(row) {
    const id = row.dataset.id;
    const data = getDeliveryMethodData(row);
    
    try {
        if (id && id !== 'new') {
            // Обновление существующего метода доставки
            await api.apiPut(`/api/admin/delivery_methods/${id}`, data);
            toast.success("Способ доставки успешно обновлен");
        } else {
            // Создание нового метода доставки
            const response = await api.apiPost("/api/admin/delivery_methods", data);
            row.dataset.id = response.id;
            toast.success("Способ доставки успешно создан");
        }
        
        cancelEditingRow(row);
        loadDeliveryMethods();
    } catch (err) {
        console.error("Error saving delivery method:", err);
        toast.error("Ошибка сохранения: " + (err.message || err));
    }
}
    
    // Загрузка вакансий
    async function loadVacancies() {
        const tbody = document.getElementById("vacancies-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка вакансий...</p>
                </td>
            </tr>
        `;
        
        try {
            const response = await api.apiGet("/api/admin/vacancies");
            const vacancies = Array.isArray(response) ? response : (response.data || []);
            renderVacanciesTable(vacancies);
        } catch (err) {
            console.error("Error loading vacancies:", err);
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">Ошибка загрузки вакансий: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки вакансий");
        }
    }
    
    // Отрисовка таблицы вакансий
    function renderVacanciesTable(vacancies) {
        const tbody = document.getElementById("vacancies-table-body");
        if (!tbody) return;
        
        if (!vacancies || vacancies.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="no-data">Вакансии не найдены</td></tr>`;
            return;
        }
        
        let html = '';
        vacancies.forEach(vacancy => {
            html += `
                <tr data-id="${vacancy.id}">
                    <td class="editable title" data-field="title" data-value="${escapeHtml(vacancy.title)}">${escapeHtml(vacancy.title)}</td>
                    <td class="editable description" data-field="description" data-value="${escapeHtml(vacancy.description || '')}">${escapeHtml(vacancy.description || '')}</td>
                    <td class="editable is_active" data-field="is_active" data-value="${vacancy.is_active}">
                        ${vacancy.is_active ? 'Активна' : 'Не активна'}
                    </td>
                    <td class="editable created_at" data-field="created_at" data-value="${vacancy.created_at}">${formatDate(vacancy.created_at)}</td>
                    <td class="row-actions">
                        <button class="btn table-action edit" title="Редактировать">
                            <span class="tooltip">Редактировать</span>
                            ✏️
                        </button>
                        <button class="btn table-action delete" title="Удалить" data-id="${vacancy.id}">
                            <span class="tooltip">Удалить</span>
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        addTableEventListeners();
    }
    
    // Загрузка характеристик
async function loadCharacteristics() {
    const tbody = document.getElementById("characteristics-table-body");
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="4" class="loader-container">
                <div class="spinner"></div>
                <p>Загрузка характеристик...</p>
            </td>
        </tr>
    `;
    
    try {
        // Сначала загружаем категории для кэша
        await loadCategoriesForCache();
        
        const response = await api.apiGet("/api/admin/characteristic_types");
        const characteristics = Array.isArray(response) ? response : (response.data || []);
        renderCharacteristicsTable(characteristics);
    } catch (err) {
        console.error("Error loading characteristics:", err);
        tbody.innerHTML = `<tr><td colspan="4" class="no-data">Ошибка загрузки характеристик: ${err.message || err}</td></tr>`;
        toast.error("Ошибка загрузки характеристик");
    }
}
    
    // Отрисовка таблицы характеристик
function renderCharacteristicsTable(characteristics) {
    const tbody = document.getElementById("characteristics-table-body");
    if (!tbody) return;
    
    if (!characteristics || characteristics.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-data">Типы характеристик не найдены</td></tr>`;
        return;
    }
    
    let html = '';
    characteristics.forEach(type => {
        html += `
            <tr data-id="${type.id}">
                <td class="editable name" data-field="name" data-value="${escapeHtml(type.name)}">${escapeHtml(type.name)}</td>
                <td class="editable unit" data-field="unit" data-value="${escapeHtml(type.unit || '')}">${escapeHtml(type.unit || '')}</td>
                <td class="editable category_id" data-field="category_id" data-value="${type.category_id || ''}">
                    ${getCategoryNameById(type.category_id) || 'Не выбрано'}
                </td>
                <td class="row-actions">
                    <button class="btn table-action edit" title="Редактировать">
                        <span class="tooltip">Редактировать</span>
                        ✏️
                    </button>
                    <button class="btn table-action delete" title="Удалить" data-id="${type.id}">
                        <span class="tooltip">Удалить</span>
                        🗑️
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
    addTableEventListeners();
}
    
    // Загрузка заказов
    async function loadOrders() {
        const tbody = document.getElementById("orders-table-body");
        if (!tbody) return;
        
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loader-container">
                    <div class="spinner"></div>
                    <p>Загрузка заказов...</p>
                </td>
            </tr>
        `;
        
        try {
            // Получаем фильтры
            const status = document.getElementById('order-status')?.value || 'all';
            const date = document.getElementById('order-date')?.value || '';
            
            // Параметры для API
            const params = {};
            if (status !== 'all') {
                params.status = status;
            }
            
            if (date) {
                params.date = date;
            }
            
            const response = await api.apiGet("/api/admin/orders", params);
            const orders = Array.isArray(response) ? response : (response.data || []);
            renderOrdersTable(orders);
        } catch (err) {
            console.error("Error loading orders:", err);
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">Ошибка загрузки заказов: ${err.message || err}</td></tr>`;
            toast.error("Ошибка загрузки заказов");
        }
    }
    
    // Отрисовка таблицы заказов
    function renderOrdersTable(orders) {
        const tbody = document.getElementById("orders-table-body");
        if (!tbody) return;
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="no-data">Заказы не найдены</td></tr>`;
            return;
        }
        
        let html = '';
        orders.forEach(order => {
            html += `
                <tr data-id="${order.id}">
                    <td class="editable user_id" data-field="user_id" data-value="${order.user_id}">
                        ${order.user_name || 'Пользователь #' + order.user_id}
                    </td>
                    <td class="editable total_amount" data-field="total_amount" data-value="${order.total_amount}">${Number(order.total_amount).toFixed(2)} ₽</td>
                    <td class="editable status" data-field="status" data-value="${order.status}">${formatOrderStatus(order.status)}</td>
                    <td class="editable created_at" data-field="created_at" data-value="${order.created_at}">${formatDate(order.created_at)}</td>
                    <td class="row-actions">
                        <button class="btn table-action edit" title="Редактировать">
                            <span class="tooltip">Редактировать</span>
                            ✏️
                        </button>
                        <button class="btn table-action delete" title="Удалить" data-id="${order.id}">
                            <span class="tooltip">Удалить</span>
                            🗑️
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        addTableEventListeners();
    }

    
    
    // Добавление обработчиков событий для таблицы
    function addTableEventListeners() {
        // Обработчик редактирования
        document.querySelectorAll('.table-action.edit').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                startEditingRow(row);
            });
        });
        
        // Обработчик удаления
        document.querySelectorAll('.table-action.delete').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                const section = this.closest('.admin-section-content').id.replace('admin-section-', '');
                if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                    deleteRecord(section, id);
                }
            });
        });
        
        // Обработчик смены пароля
        document.querySelectorAll('.table-action.password').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                showChangePasswordModal(id);
            });
        });
        
        // Обработчик клика по ячейке для редактирования
        document.querySelectorAll('.editable').forEach(cell => {
            cell.addEventListener('click', function(e) {
                e.stopPropagation();
                const row = this.closest('tr');
                if (!row.classList.contains('editing')) {
                    startEditingRow(row);
                }
            });
        });

            // Обработчик смены пароля
    document.querySelectorAll('.table-action.password').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            showChangePasswordModal(id);
        });
    });
        
        // Добавлять новую строку для товаров
        document.getElementById('add-product-row')?.addEventListener('click', function() {
            addNewProductRow();
        });
        
        // Добавлять новую строку для пользователей
        document.getElementById('add-user-row')?.addEventListener('click', function() {
            addNewUserRow();
        });
        
        // Добавлять новую строку для категорий
        document.getElementById('add-category-row')?.addEventListener('click', function() {
            addNewCategoryRow();
        });
        
        // Добавлять новую строку для производителей
        document.getElementById('add-manufacturer-row')?.addEventListener('click', function() {
            addNewManufacturerRow();
        });
        
        // Добавлять новую строку для способов доставки
        document.getElementById('add-delivery-method-row')?.addEventListener('click', function() {
            addNewDeliveryMethodRow();
        });
        
        // Добавлять новую строку для способов оплаты
        document.getElementById('add-payment-method-row')?.addEventListener('click', function() {
            addNewPaymentMethodRow();
        });
        
        // Добавлять новую строку для вакансий
        document.getElementById('add-vacancy-row')?.addEventListener('click', function() {
            addNewVacancyRow();
        });
        
        // Добавлять новую строку для характеристик
        document.getElementById('add-characteristic-row')?.addEventListener('click', function() {
            addNewCharacteristicRow();
        });
        
        // Поиск товаров
        document.getElementById('product-search')?.addEventListener('input', function(e) {
            loadProducts();
        });
        
        // Поиск пользователей
        document.getElementById('user-search')?.addEventListener('input', function(e) {
            loadUsers();
        });
        
        // Фильтр по статусу заказов
        document.getElementById('order-status')?.addEventListener('change', function(e) {
            loadOrders();
        });
        
        // Фильтр по дате заказов
        document.getElementById('order-date')?.addEventListener('change', function(e) {
            loadOrders();
        });
    }
    
    // Универсальная функция для удаления записи
    async function deleteRecord(entity, id) {
        try {
            await api.apiDelete(`/api/admin/${entity}/${id}`);
            toast.success("Запись успешно удалена");
            loadSectionData(document.querySelector('.admin-menu .active')?.dataset?.section || 'dashboard');
        } catch (err) {
            console.error(`Error deleting ${entity}:`, err);
            toast.error(`Ошибка удаления: ${err.message || err}`);
        }
    }
    
    // Показать модальное окно для смены пароля
    function showChangePasswordModal(userId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h3>Сменить пароль пользователя</h3>
                <form id="change-password-form">
                    <input type="hidden" name="user_id" value="${userId}">
                    <div class="form-group">
                        <label for="new-password">Новый пароль:</label>
                        <input type="password" id="new-password" name="password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirm-password">Подтвердите пароль:</label>
                        <input type="password" id="confirm-password" name="confirm_password" required minlength="6">
                    </div>
                    <button type="submit" class="btn primary">Сохранить</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие модального окна
        modal.querySelector('.close-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Отправка формы
        modal.querySelector('#change-password-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const password = this.password.value;
            const confirmPassword = this.confirm_password.value;
            
            if (password !== confirmPassword) {
                toast.error("Пароли не совпадают");
                return;
            }
            
            try {
                await api.apiPut(`/api/admin/users/${userId}/password`, { password });
                toast.success("Пароль успешно изменен");
                document.body.removeChild(modal);
            } catch (err) {
                console.error("Error changing password:", err);
                toast.error("Ошибка изменения пароля: " + (err.message || err));
            }
        });
    }
    
    // Начало редактирования строки
    function startEditingRow(row) {
        if (row.classList.contains('editing')) return;
        const sectionId = row.closest('.admin-section-content').id;
        const entity = sectionId.replace('admin-section-', '');
        
        row.classList.add('editing');
        const cells = row.querySelectorAll('.editable');
        cells.forEach(cell => {
            const field = cell.dataset.field;
            const value = cell.dataset.value || cell.textContent.trim();
            const type = getFieldType(field, entity);
            let inputHtml = '';
            
            switch(type) {
                case 'text':
                    inputHtml = `<input type="text" class="inline-edit" value="${escapeHtml(value)}">`;
                    break;
                case 'textarea':
                    inputHtml = `<textarea class="inline-edit">${escapeHtml(value)}</textarea>`;
                    break;
                case 'number':
                    inputHtml = `<input type="number" class="inline-edit" value="${value}" step="${field === 'price' ? '0.01' : '1'}">`;
                    break;
                case 'select':
                    if (field === 'category_id') {
                        inputHtml = generateCategorySelect(value);
                    } else if (field === 'manufacturer_id') {
                        inputHtml = generateManufacturerSelect(value);
                    } else if (field === 'is_admin' || field === 'is_active') {
                        inputHtml = generateBooleanSelect(value === 'true' || value === 'Админ' || value === 'Активен' || value === 'Да');
                    } else if (field === 'status') {
                        inputHtml = generateOrderStatusSelect(value);
                    }
                    break;
                case 'date':
                    inputHtml = `<input type="date" class="inline-edit" value="${value.split('T')[0]}">`;
                    break;
            }
            
            if (inputHtml) {
                cell.innerHTML = inputHtml;
                cell.querySelector('.inline-edit, .inline-select')?.focus();
            }
        });
        
        // Добавляем кнопки сохранения/отмены
        const actionsCell = row.querySelector('.row-actions');
        if (actionsCell) {
            actionsCell.innerHTML = `
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Сохранить</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            `;
            
            // Обработчики для кнопок сохранения/отмены
            actionsCell.querySelector('.save')?.addEventListener('click', function(e) {
                e.stopPropagation();
                saveRow(row, entity);
            });
            
            actionsCell.querySelector('.cancel')?.addEventListener('click', function(e) {
                e.stopPropagation();
                cancelEditingRow(row);
            });
        }
    }
    
    // Получение типа поля для редактирования
    function getFieldType(field, entity) {
        switch(entity) {
            case 'products':
                switch(field) {
                    case 'name':
                    case 'sku':
                        return 'text';
                    case 'description':
                        return 'textarea';
                    case 'price':
                    case 'stock_quantity':
                        return 'number';
                    case 'category_id':
                    case 'manufacturer_id':
                        return 'select';
                    default:
                        return 'text';
                }
            case 'users':
                switch(field) {
                    case 'first_name':
                    case 'last_name':
                    case 'email':
                    case 'phone':
                        return 'text';
                    case 'is_admin':
                    case 'is_active':
                        return 'select';
                    default:
                        return 'text';
                }
            case 'categories':
                switch(field) {
                    case 'name':
                    case 'slug':
                        return 'text';
                    case 'description':
                        return 'textarea';
                    default:
                        return 'text';
                }
            case 'manufacturers':
                switch(field) {
                    case 'name':
                    case 'country':
                    case 'website':
                        return 'text';
                    default:
                        return 'text';
                }
            case 'delivery-methods':
                switch(field) {
                    case 'name':
                    case 'description':
                        return 'text';
                    case 'base_cost':
                    case 'free_threshold':
                        return 'number';
                    case 'estimated_days':
                        return 'number';
                    case 'is_active':
                        return 'select';
                    default:
                        return 'text';
                }
            case 'payment-methods':
                switch(field) {
                    case 'name':
                    case 'description':
                        return 'text';
                    case 'is_active':
                        return 'select';
                    default:
                        return 'text';
                }
            case 'vacancies':
                switch(field) {
                    case 'title':
                    case 'description':
                    case 'requirements':
                    case 'conditions':
                    case 'contact_email':
                        return 'text';
                    case 'is_active':
                        return 'select';
                    case 'created_at':
                        return 'date';
                    default:
                        return 'text';
                }
            case 'characteristics':
                switch(field) {
                    case 'name':
                    case 'unit':
                        return 'text';
                    case 'category_id':
                        return 'select';
                    default:
                        return 'text';
                }
            case 'orders':
                switch(field) {
                    case 'status':
                        return 'select';
                    case 'total_amount':
                        return 'number';
                    case 'created_at':
                        return 'date';
                    default:
                        return 'text';
                }
            default:
                return 'text';
        }
    }
    
    // Генерация выпадающего списка категорий
    function generateCategorySelect(selectedId) {
        if (categoriesCache.length === 0) {
            return `<select class="inline-select"><option>Загрузка...</option></select>`;
        }
        
        let options = categoriesCache.map(category =>
            `<option value="${category.id}" ${category.id == selectedId ? 'selected' : ''}>${escapeHtml(category.name)}</option>`
        );
        
        return `<select class="inline-select">${options}</select>`;
    }
    
    // Генерация выпадающего списка производителей
    function generateManufacturerSelect(selectedId) {
        if (manufacturersCache.length === 0) {
            return `<select class="inline-select"><option>Загрузка...</option></select>`;
        }
        
        let options = manufacturersCache.map(manufacturer =>
            `<option value="${manufacturer.id}" ${manufacturer.id == selectedId ? 'selected' : ''}>${escapeHtml(manufacturer.name)}</option>`
        );
        
        return `<select class="inline-select">${options}</select>`;
    }
    
    // Генерация выпадающего списка для boolean значений
    function generateBooleanSelect(isSelected) {
        return `
            <select class="inline-select">
                <option value="true" ${isSelected ? 'selected' : ''}>Да</option>
                <option value="false" ${!isSelected ? 'selected' : ''}>Нет</option>
            </select>
        `;
    }
    
    // Генерация выпадающего списка статусов заказа
    function generateOrderStatusSelect(status) {
        const statuses = [
            {value: 'created', label: 'Создан'},
            {value: 'processing', label: 'В обработке'},
            {value: 'shipped', label: 'Отправлен'},
            {value: 'delivered', label: 'Доставлен'},
            {value: 'cancelled', label: 'Отменен'}
        ];
        
        let options = statuses.map(s =>
            `<option value="${s.value}" ${s.value === status ? 'selected' : ''}>${s.label}</option>`
        );
        
        return `<select class="inline-select">${options}</select>`;
    }
    
    // Универсальная функция сохранения строки
    async function saveRow(row, entity) {
        const id = row.dataset.id;
        const cells = row.querySelectorAll('.editable');
        const data = {};
        
        cells.forEach(cell => {
            const field = cell.dataset.field;
            const input = cell.querySelector('.inline-edit, .inline-select');
            if (!input) return;
            
            const value = input.value.trim();
            
            switch(entity) {
                case 'products':
                    if (field === 'price' || field === 'stock_quantity') {
                        data[field] = parseFloat(value) || 0;
                    } else if (field === 'category_id' || field === 'manufacturer_id') {
                        data[field] = value ? parseInt(value) : null;
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'users':
                    if (field === 'is_admin' || field === 'is_active') {
                        data[field] = value === 'true';
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'categories':
                    if (field === 'parent_id') {
                        data[field] = value ? parseInt(value) : null;
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'manufacturers':
                    data[field] = value;
                    break;
                case 'delivery-methods':
                    if (field === 'base_cost' || field === 'free_threshold') {
                        data[field] = value ? parseFloat(value) : 0;
                    } else if (field === 'estimated_days') {
                        data[field] = value ? parseInt(value) : 0;
                    } else if (field === 'is_active') {
                        data[field] = value === 'true';
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'payment-methods':
                    if (field === 'is_active') {
                        data[field] = value === 'true';
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'vacancies':
                    if (field === 'is_active') {
                        data[field] = value === 'true';
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'characteristics':
                    if (field === 'category_id') {
                        data[field] = value ? parseInt(value) : null;
                    } else {
                        data[field] = value;
                    }
                    break;
                case 'orders':
                    if (field === 'total_amount') {
                        data[field] = parseFloat(value) || 0;
                    } else {
                        data[field] = value;
                    }
                    break;
            }
        });
        
        try {
            if (id && id !== 'new') {
                // Обновление существующей записи
                const endpoint = getEndpointForEntity(entity, id);
                await api.apiPut(endpoint, data);
                toast.success("Запись успешно обновлена");
            } else {
                // Создание новой записи
                const endpoint = getEndpointForEntity(entity);
                const response = await api.apiPost(endpoint, data);
                // Устанавливаем ID только если он пришел в ответе
                if (response && (response.id || response.data?.id)) {
                    const newId = response.id || response.data.id;
                    row.dataset.id = newId;
                }
                toast.success("Запись успешно создана");
            }
            
            cancelEditingRow(row);
            loadSectionData(entity);
        } catch (err) {
            console.error(`Error saving ${entity}:`, err);
            toast.error(`Ошибка сохранения: ${err.message || err}`);
        }
    }
    
    // Получение эндпоинта для сущности
    function getEndpointForEntity(entity, id = null) {
        switch(entity) {
            case 'products': 
                return id ? `/api/admin/products/${id}` : '/api/admin/products';
            case 'users': 
                return id ? `/api/admin/users/${id}` : '/api/admin/users';
            case 'categories': 
                return id ? `/api/admin/categories/${id}` : '/api/admin/categories';
            case 'manufacturers': 
                return id ? `/api/admin/manufacturers/${id}` : '/api/admin/manufacturers';
            case 'delivery-methods': 
                return id ? `/api/admin/delivery_methods/${id}` : '/api/admin/delivery_methods';
            case 'payment-methods': 
                return id ? `/api/admin/payment_methods/${id}` : '/api/admin/payment_methods';
            case 'vacancies': 
                return id ? `/api/admin/vacancies/${id}` : '/api/admin/vacancies';
            case 'characteristics': 
                return id ? `/api/admin/characteristic_types/${id}` : '/api/admin/characteristic_types';
            case 'orders': 
                return id ? `/api/admin/orders/${id}` : '/api/admin/orders';
            default:
                return `/${entity}${id ? `/${id}` : ''}`;
        }
    }
    
    // Отмена редактирования строки
    function cancelEditingRow(row) {
        row.classList.remove('editing');
        
        // Если это новая строка, удаляем ее
        if (row.dataset.id === 'new') {
            row.remove();
            return;
        }
        
        // Восстанавливаем обычный вид ячеек
        const cells = row.querySelectorAll('.editable');
        cells.forEach(cell => {
            const field = cell.dataset.field;
            let text = cell.dataset.value || '';
            
            switch(field) {
                case 'price':
                    text = formatPrice(text);
                    break;
                case 'is_admin':
                case 'is_active':
                    text = text === 'true' ? 'Да' : 'Нет';
                    break;
                case 'created_at':
                    text = formatDate(text);
                    break;
                case 'category_id':
                    text = getCategoryNameById(text) || 'Не выбрано';
                    break;
                case 'manufacturer_id':
                    text = getManufacturerNameById(text) || 'Не выбрано';
                    break;
                case 'status':
                    text = formatOrderStatus(text);
                    break;
                case 'free_threshold':
                    text = text ? formatPrice(text) : '—';
                    break;
                default:
                    // Для описания в способах оплаты и доставки
                    if (field === 'description' && typeof text === 'object') {
                        // Обрабатываем sql.NullString
                        if (text.String !== undefined) {
                            text = text.String || '';
                        } else {
                            text = text.text || text.value || JSON.stringify(text);
                        }
                    }
            }
            
            cell.innerHTML = text;
        });
        
        // Восстанавливаем кнопки действий
        const actionsCell = row.querySelector('.row-actions');
        if (actionsCell) {
            const entity = row.closest('.admin-section-content').id.replace('admin-section-', '');
            const id = row.dataset.id;
            
            let buttonsHtml = `
                <button class="btn table-action edit" title="Редактировать">
                    <span class="tooltip">Редактировать</span>
                    ✏️
                </button>
                <button class="btn table-action delete" title="Удалить" data-id="${id}">
                    <span class="tooltip">Удалить</span>
                    🗑️
                </button>
            `;
            
            // Для пользователей добавляем кнопку изменения пароля
            if (entity === 'users') {
                buttonsHtml += `
                    <button class="btn table-action password" title="Сменить пароль" data-id="${id}">
                        <span class="tooltip">Сменить пароль</span>
                        🔑
                    </button>
                `;
            }
            
            actionsCell.innerHTML = buttonsHtml;
            
            // Добавляем обработчики для новых кнопок
            actionsCell.querySelector('.edit')?.addEventListener('click', function(e) {
                e.stopPropagation();
                startEditingRow(row);
            });
            
            actionsCell.querySelector('.delete')?.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                    deleteRecord(entity, id);
                }
            });
            
            actionsCell.querySelector('.password')?.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                showChangePasswordModal(id);
            });
        }
    }
    
    // Добавление новой строки для товара
    function addNewProductRow() {
        const tbody = document.getElementById("products-table-body");
        if (!tbody) return;
        
        // Удаляем существующие новые строки
        document.querySelectorAll('tr.new-row').forEach(row => row.remove());
        
        const newRow = document.createElement('tr');
        newRow.className = 'new-row editing';
        newRow.dataset.id = 'new';
        
        newRow.innerHTML = `
            <td class="editable name" data-field="name" data-value=""><input type="text" class="inline-edit" placeholder="Название товара"></td>
            <td class="editable description" data-field="description" data-value=""><textarea class="inline-edit" placeholder="Описание товара"></textarea></td>
            <td class="editable sku" data-field="sku" data-value=""><input type="text" class="inline-edit" placeholder="Артикул"></td>
            <td class="editable price" data-field="price" data-value=""><input type="number" class="inline-edit" step="0.01" placeholder="Цена"></td>
            <td class="editable category" data-field="category_id" data-value="">${generateCategorySelect('')}</td>
            <td class="editable manufacturer" data-field="manufacturer_id" data-value="">${generateManufacturerSelect('')}</td>
            <td class="editable image_path" data-field="image_path" data-value=""><input type="text" class="inline-edit" placeholder="Путь к изображению"></td>
            <td class="editable stock_quantity" data-field="stock_quantity" data-value="0"><input type="number" class="inline-edit" value="0" min="0"></td>
            <td class="row-actions">
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Создать товар</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            </td>
        `;
        
        tbody.prepend(newRow);
        
        // Фокус на поле названия
        newRow.querySelector('.name input')?.focus();
        
        // Добавляем обработчики для новых кнопок
        newRow.querySelector('.save')?.addEventListener('click', function(e) {
            e.stopPropagation();
            saveRow(newRow, 'products');
        });
        
        newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
            e.stopPropagation();
            newRow.remove();
        });
    }
    
    // Добавление новой строки для пользователя
function addNewUserRow() {
    const tbody = document.getElementById("users-table-body");
    if (!tbody) return;
    
    document.querySelectorAll('tr.new-row').forEach(row => row.remove());
    
    const newRow = document.createElement('tr');
    newRow.className = 'new-row editing';
    newRow.dataset.id = 'new';
    
    newRow.innerHTML = `
        <td class="editable first_name" data-field="first_name" data-value=""><input type="text" class="inline-edit" placeholder="Имя" required></td>
        <td class="editable last_name" data-field="last_name" data-value=""><input type="text" class="inline-edit" placeholder="Фамилия" required></td>
        <td class="editable mid_name" data-field="mid_name" data-value=""><input type="text" class="inline-edit" placeholder="Отчество"></td>
        <td class="editable email" data-field="email" data-value=""><input type="email" class="inline-edit" placeholder="Email" required></td>
        <td class="editable phone" data-field="phone" data-value=""><input type="tel" class="inline-edit" placeholder="Телефон"></td>
        <td class="editable is_admin" data-field="is_admin" data-value="false">${generateBooleanSelect(false)}</td>
        <td></td>
        <td class="row-actions">
            <button class="btn table-action save" title="Сохранить">
                <span class="tooltip">Создать пользователя</span>
                ✓
            </button>
            <button class="btn table-action cancel" title="Отменить">
                <span class="tooltip">Отменить</span>
                ✗
            </button>
        </td>
    `;
    
    tbody.prepend(newRow);
    newRow.querySelector('.first_name input')?.focus();
    
    newRow.querySelector('.save')?.addEventListener('click', function(e) {
        e.stopPropagation();
        saveUserRow(newRow);
    });
    
    newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
        e.stopPropagation();
        newRow.remove();
    });
}
    
    // Добавление новой строки для категории
    function addNewCategoryRow() {
        const tbody = document.getElementById("categories-table-body");
        if (!tbody) return;
        
        document.querySelectorAll('tr.new-row').forEach(row => row.remove());
        
        const newRow = document.createElement('tr');
        newRow.className = 'new-row editing';
        newRow.dataset.id = 'new';
        
        newRow.innerHTML = `
            <td class="editable name" data-field="name" data-value=""><input type="text" class="inline-edit" placeholder="Название"></td>
            <td class="editable description" data-field="description" data-value=""><textarea class="inline-edit" placeholder="Описание"></textarea></td>
            <td class="editable slug" data-field="slug" data-value=""><input type="text" class="inline-edit" placeholder="Slug"></td>
            <td class="row-actions">
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Создать категорию</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            </td>
        `;
        
        tbody.prepend(newRow);
        newRow.querySelector('.name input')?.focus();
        
        newRow.querySelector('.save')?.addEventListener('click', function(e) {
            e.stopPropagation();
            saveRow(newRow, 'categories');
        });
        
        newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
            e.stopPropagation();
            newRow.remove();
        });
    }
    
    // Добавление новой строки для производителя
    function addNewManufacturerRow() {
        const tbody = document.getElementById("manufacturers-table-body");
        if (!tbody) return;
        
        document.querySelectorAll('tr.new-row').forEach(row => row.remove());
        
        const newRow = document.createElement('tr');
        newRow.className = 'new-row editing';
        newRow.dataset.id = 'new';
        
        newRow.innerHTML = `
            <td class="editable name" data-field="name" data-value=""><input type="text" class="inline-edit" placeholder="Название"></td>
            <td class="editable country" data-field="country" data-value=""><input type="text" class="inline-edit" placeholder="Страна"></td>
            <td class="editable website" data-field="website" data-value=""><input type="text" class="inline-edit" placeholder="Сайт"></td>
            <td class="row-actions">
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Создать производителя</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            </td>
        `;
        
        tbody.prepend(newRow);
        newRow.querySelector('.name input')?.focus();
        
        newRow.querySelector('.save')?.addEventListener('click', function(e) {
            e.stopPropagation();
            saveRow(newRow, 'manufacturers');
        });
        
        newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
            e.stopPropagation();
            newRow.remove();
        });
    }
    
    // Добавление новой строки для способа доставки
    function addNewDeliveryMethodRow() {
        const tbody = document.getElementById("delivery-methods-table-body");
        if (!tbody) return;
        
        document.querySelectorAll('tr.new-row').forEach(row => row.remove());
        
        const newRow = document.createElement('tr');
        newRow.className = 'new-row editing';
        newRow.dataset.id = 'new';
        
        newRow.innerHTML = `
            <td class="editable name" data-field="name" data-value=""><input type="text" class="inline-edit" placeholder="Название"></td>
            <td class="editable description" data-field="description" data-value=""><textarea class="inline-edit" placeholder="Описание"></textarea></td>
            <td class="editable base_cost" data-field="base_cost" data-value="0"><input type="number" class="inline-edit" value="0" step="0.01" placeholder="Базовая стоимость"></td>
            <td class="editable free_threshold" data-field="free_threshold" data-value=""><input type="number" class="inline-edit" step="0.01" placeholder="Порог бесплатной доставки"></td>
            <td class="editable estimated_days" data-field="estimated_days" data-value="0"><input type="number" class="inline-edit" value="0" placeholder="Срок доставки (дни)"></td>
            <td class="editable is_active" data-field="is_active" data-value="true">${generateBooleanSelect(true)}</td>
            <td class="row-actions">
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Создать способ доставки</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            </td>
        `;
        
        tbody.prepend(newRow);
        newRow.querySelector('.name input')?.focus();
        
        newRow.querySelector('.save')?.addEventListener('click', function(e) {
            e.stopPropagation();
            saveRow(newRow, 'delivery-methods');
        });
        
        newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
            e.stopPropagation();
            newRow.remove();
        });
    }
    
    // Добавление новой строки для способа оплаты
    function addNewPaymentMethodRow() {
        const tbody = document.getElementById("payment-methods-table-body");
        if (!tbody) return;
        
        document.querySelectorAll('tr.new-row').forEach(row => row.remove());
        
        const newRow = document.createElement('tr');
        newRow.className = 'new-row editing';
        newRow.dataset.id = 'new';
        
        newRow.innerHTML = `
            <td class="editable name" data-field="name" data-value=""><input type="text" class="inline-edit" placeholder="Название"></td>
            <td class="editable description" data-field="description" data-value=""><textarea class="inline-edit" placeholder="Описание"></textarea></td>
            <td class="editable is_active" data-field="is_active" data-value="true">${generateBooleanSelect(true)}</td>
            <td class="row-actions">
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Создать способ оплаты</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            </td>
        `;
        
        tbody.prepend(newRow);
        newRow.querySelector('.name input')?.focus();
        
        newRow.querySelector('.save')?.addEventListener('click', function(e) {
            e.stopPropagation();
            saveRow(newRow, 'payment-methods');
        });
        
        newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
            e.stopPropagation();
            newRow.remove();
        });
    }
    
    // Добавление новой строки для вакансии
    function addNewVacancyRow() {
        const tbody = document.getElementById("vacancies-table-body");
        if (!tbody) return;
        
        document.querySelectorAll('tr.new-row').forEach(row => row.remove());
        
        const newRow = document.createElement('tr');
        newRow.className = 'new-row editing';
        newRow.dataset.id = 'new';
        
        newRow.innerHTML = `
            <td class="editable title" data-field="title" data-value=""><input type="text" class="inline-edit" placeholder="Название"></td>
            <td class="editable description" data-field="description" data-value=""><textarea class="inline-edit" placeholder="Описание"></textarea></td>
            <td class="editable is_active" data-field="is_active" data-value="true">${generateBooleanSelect(true)}</td>
            <td class="editable created_at" data-field="created_at" data-value="${new Date().toISOString().split('T')[0]}"><input type="date" class="inline-edit" value="${new Date().toISOString().split('T')[0]}"></td>
            <td class="row-actions">
                <button class="btn table-action save" title="Сохранить">
                    <span class="tooltip">Создать вакансию</span>
                    ✓
                </button>
                <button class="btn table-action cancel" title="Отменить">
                    <span class="tooltip">Отменить</span>
                    ✗
                </button>
            </td>
        `;
        
        tbody.prepend(newRow);
        newRow.querySelector('.title input')?.focus();
        
        newRow.querySelector('.save')?.addEventListener('click', function(e) {
            e.stopPropagation();
            saveRow(newRow, 'vacancies');
        });
        
        newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
            e.stopPropagation();
            newRow.remove();
        });
    }
    
    // Добавление новой строки для характеристики
    function addNewCharacteristicRow() {
    const tbody = document.getElementById("characteristics-table-body");
    if (!tbody) return;
    
    document.querySelectorAll('tr.new-row').forEach(row => row.remove());
    
    const newRow = document.createElement('tr');
    newRow.className = 'new-row editing';
    newRow.dataset.id = 'new';
    
    newRow.innerHTML = `
        <td class="editable name" data-field="name" data-value=""><input type="text" class="inline-edit" placeholder="Название"></td>
        <td class="editable unit" data-field="unit" data-value=""><input type="text" class="inline-edit" placeholder="Единица измерения"></td>
        <td class="editable category_id" data-field="category_id" data-value="">${generateCategorySelect('')}</td>
        <td class="row-actions">
            <button class="btn table-action save" title="Сохранить">
                <span class="tooltip">Создать характеристику</span>
                ✓
            </button>
            <button class="btn table-action cancel" title="Отменить">
                <span class="tooltip">Отменить</span>
                ✗
            </button>
        </td>
    `;
    
    tbody.prepend(newRow);
    newRow.querySelector('.name input')?.focus();
    
    newRow.querySelector('.save')?.addEventListener('click', function(e) {
        e.stopPropagation();
        saveRow(newRow, 'characteristics');
    });
    
    newRow.querySelector('.cancel')?.addEventListener('click', function(e) {
        e.stopPropagation();
        newRow.remove();
    });
}

// Сохранение пользователя
async function saveUserRow(row) {
    const id = row.dataset.id;
    const cells = row.querySelectorAll('.editable');
    const data = {};
    
    cells.forEach(cell => {
        const field = cell.dataset.field;
        const input = cell.querySelector('.inline-edit, .inline-select');
        if (!input) return;
        
        const value = input.value.trim();
        
        switch(field) {
            case 'is_admin':
                data[field] = value === 'true';
                break;
            default:
                data[field] = value || null;
        }
    });
    
    // Для нового пользователя требуется пароль
    if (id === 'new') {
        const password = prompt('Введите пароль для нового пользователя (минимум 6 символов):');
        if (!password || password.length < 6) {
            toast.error("Пароль должен быть не менее 6 символов");
            return;
        }
        data.password = password;
    }
    
    try {
        if (id && id !== 'new') {
            // Обновление существующего пользователя
            await api.apiPut(`/api/admin/users/${id}`, data);
            toast.success("Пользователь успешно обновлен");
        } else {
            // Создание нового пользователя
            const response = await api.apiPost("/api/admin/users", data);
            row.dataset.id = response.id;
            toast.success("Пользователь успешно создан");
        }
        
        cancelEditingRow(row);
        loadUsers();
    } catch (err) {
        console.error("Error saving user:", err);
        toast.error("Ошибка сохранения: " + (err.message || err));
    }
}

// Показать модальное окно для смены пароля
function showChangePasswordModal(userId) {
    const modal = document.createElement('div');
    modal.className = 'modal password-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h3>Сменить пароль пользователя</h3>
            <form id="change-password-form">
                <div class="form-group">
                    <label for="new-password">Новый пароль:</label>
                    <input type="password" id="new-password" name="password" required minlength="6" placeholder="Минимум 6 символов">
                </div>
                <div class="form-group">
                    <label for="confirm-password">Подтвердите пароль:</label>
                    <input type="password" id="confirm-password" name="confirm_password" required minlength="6">
                </div>
                <button type="submit" class="btn primary">Сохранить</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Закрытие модального окна
    modal.querySelector('.close-modal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    // Отправка формы
    modal.querySelector('#change-password-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const password = this.password.value;
        const confirmPassword = this.confirm_password.value;
        
        if (password !== confirmPassword) {
            toast.error("Пароли не совпадают");
            return;
        }
        
        try {
            await api.apiPut(`/api/admin/users/${userId}/password`, { password });
            toast.success("Пароль успешно изменен");
            document.body.removeChild(modal);
        } catch (err) {
            console.error("Error changing password:", err);
            toast.error("Ошибка изменения пароля: " + (err.message || err));
        }
    });
}
    
    // Инициализация при загрузке DOM
    document.addEventListener("DOMContentLoaded", async function() {
        // Удаляем все существующие обработчики событий
        document.querySelectorAll(".admin-menu .menu-item").forEach(item => {
            item.removeEventListener("click", item._handler);
        });
        
        const isAuthorized = await checkAdminAccess();
        if (!isAuthorized) return;
        
        initNavigation();
        
        // Загружаем данные для активного раздела
        const activeSection = document.querySelector('.admin-menu .active')?.dataset?.section || 'dashboard';
        loadSectionData(activeSection);
        
        // Подгружаем кэш для категорий и производителей
        await Promise.all([
            loadCategoriesForCache(),
            loadManufacturersForCache()
        ]);
    });
})();