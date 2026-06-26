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
