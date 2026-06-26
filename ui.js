function switchTab(tabId) {
    if (isTabsEditMode) return;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Попробуем найти кнопку для этого таба и сделать её активной
    const targetBtn = document.querySelector(`.tab-btn[onclick*="switchTab('${tabId}')"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }
    
    document.querySelectorAll('.category-content').forEach(c => c.classList.remove('active'));
    
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function handleSettingsChange() {
    updateDropdownPrices();
    updateSillWidths();
    renderCart();
    
    const companySelect = document.getElementById('select-company');
    if (companySelect) {
        const comp = COMPANIES[companySelect.value];
        if (comp) {
            const reqEl = document.getElementById('company-requisites');
            if (reqEl) reqEl.innerHTML = `<p class="font-bold text-slate-800 text-xs">${comp.name_full}</p><p>${comp.req}</p>`;
            
            const signEl = document.getElementById('company-sign-name');
            if (signEl) signEl.innerText = comp.sign_name + " (подпись)";
            
            const contEl = document.getElementById('company-contacts');
            if (contEl) contEl.innerHTML = comp.contacts;
        }
    }
}

function restartOkoTour() {
    localStorage.removeItem('oko_tour_completed');
    if (typeof closeAdminPanel === 'function') closeAdminPanel();
    setTimeout(initOkoTour, 400);
}

// === OKO ONBOARDING TOUR ===
function initOkoTour() {
    // Проверяем, проходил ли пользователь уже тур
    if (localStorage.getItem('oko_tour_completed') === 'true') {
        return;
    }
    
    // Проверяем, загружен ли driver.js
    if (typeof window.driver === 'undefined') {
        return;
    }
    
    const driverObj = window.driver.js.driver({
        showProgress: true,
        allowClose: true,
        doneBtnText: 'Готово',
        nextBtnText: 'Следующий этап',
        prevBtnText: 'Предыдущий этап',
        steps: [
            {
                popover: {
                    title: 'Добро пожаловать в Око! 👋',
                    description: 'Это ваш новый чистый аккаунт. Давайте мы покажем, где загрузить свои цены и настроить логотип компании.',
                }
            },
            {
                element: '#admin-panel-btn',
                popover: {
                    title: 'Панель управления ⚙️',
                    description: 'Здесь находятся все настройки вашего аккаунта. Мы откроем её для вас на следующем шаге.',
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '#admin-panel',
                popover: {
                    title: 'Ваши настройки',
                    description: 'Здесь вы можете управлять прайс-листами, сотрудниками и визуалом коммерческих предложений.',
                },
                onHighlightStarted: (element) => {
                    if (typeof openAdminPanel === 'function') openAdminPanel();
                }
            },
            {
                element: '[data-target="tab-admin-glasses"]',
                popover: {
                    title: 'Установка цен 💰',
                    description: 'По этим вкладкам можно настроить цены. Скачайте шаблон Excel, заполните свои цены и загрузите обратно. Система всё пересчитает!',
                    side: 'bottom',
                    align: 'start'
                }
            },
            {
                element: '[data-target="tab-admin-brand"]',
                popover: {
                    title: 'Настройка бренда 🎨',
                    description: 'Здесь загрузите свой логотип, QR-код, выберите фирменный цвет и впишите реквизиты.',
                    side: 'bottom',
                    align: 'start'
                }
            }
        ],
        onDestroyStarted: () => {
            // Создаём кастомное подтверждение с текстом "Пропустить обучение полностью"
            if (!driverObj.hasNextStep() || confirm("Вы уверены, что хотите пропустить обучение полностью? Вы сможете настроить всё сами позже.")) {
                localStorage.setItem('oko_tour_completed', 'true');
                driverObj.destroy();
            }
        }
    });

    driverObj.drive();
}
