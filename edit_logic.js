

// ==========================================
// EDIT MODE SYSTEM (КП Редактирование)
// ==========================================
window.editingGroupId = null;

function commitItemsToCart(itemsToPush, tabId) {
    let rawData = captureRawData(tabId);
    let groupId = Date.now();
    let insertIndex = ITEMS.length;

    if (window.editingGroupId) {
        insertIndex = ITEMS.findIndex(i => (i.groupId || i.id) === window.editingGroupId);
        if (insertIndex === -1) insertIndex = ITEMS.length;
        ITEMS = ITEMS.filter(i => (i.groupId || i.id) !== window.editingGroupId);
        window.editingGroupId = null;
        resetAddButton(tabId);
    }

    itemsToPush.forEach((item, idx) => {
        if (!item.id) item.id = groupId + idx;
        item.groupId = groupId;
        item.tabId = tabId;
        if (idx === 0) item.rawData = rawData; 
    });

    ITEMS.splice(insertIndex, 0, ...itemsToPush);
    renderCart();
}

function captureRawData(tabId) {
    let data = {};
    let tab = document.getElementById(tabId);
    if (!tab) return data;
    let inputs = tab.querySelectorAll('input, select, textarea');
    inputs.forEach(el => {
        if (el.id) {
            if (el.type === 'checkbox' || el.type === 'radio') data[el.id] = el.checked;
            else data[el.id] = el.value;
        }
    });
    return data;
}

function restoreRawData(data) {
    if (!data) return;
    for (let id in data) {
        let el = document.getElementById(id);
        if (el) {
            if (el.type === 'checkbox' || el.type === 'radio') {
                el.checked = data[id];
            } else {
                el.value = data[id];
            }
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

function editItem(groupId, tabId) {
    let item = ITEMS.find(i => (i.groupId || i.id) === groupId);
    if (!item || !item.rawData) {
        alert("Редактирование этой позиции невозможно (добавлена до обновления).");
        return;
    }
    
    window.editingGroupId = groupId;
    let cleanTabId = tabId.replace('tab-', '');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    let activeBtn = document.querySelector(`button[onclick="switchTab('${cleanTabId}')"]`);
    if(activeBtn) activeBtn.classList.add('active');
    
    document.querySelectorAll('.category-content').forEach(c => c.classList.remove('active'));
    let targetTab = document.getElementById(tabId);
    if(targetTab) targetTab.classList.add('active');
    
    if (tabId === 'tab-shower' && typeof generateShowerFields === 'function') {
        let layoutEl = document.getElementById('shower-layout');
        if (layoutEl) {
            layoutEl.value = item.rawData['shower-layout'];
            generateShowerFields();
        }
    }

    restoreRawData(item.rawData);
    
    let btn = document.querySelector(`#${tabId} button[onclick^="add"]`);
    if (btn) {
        if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = `<i data-lucide="save" class="w-5 h-5"></i> Сохранить изменения`;
        btn.classList.remove('from-brand-primary', 'to-brand-secondary');
        btn.classList.add('from-emerald-500', 'to-emerald-600');
        btn.setAttribute('data-editing', 'true');
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function resetAddButton(tabId) {
    let btn = document.querySelector(`#${tabId} button[onclick^="add"]`);
    if (btn && btn.getAttribute('data-editing') === 'true') {
        btn.innerHTML = btn.dataset.originalHtml || `<i data-lucide="plus-circle" class="w-5 h-5"></i> Добавить в смету`;
        btn.classList.remove('from-emerald-500', 'to-emerald-600');
        btn.classList.add('from-brand-primary', 'to-brand-secondary');
        btn.removeAttribute('data-editing');
    }
}
