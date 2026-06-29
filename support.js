const TELEGRAM_BOT_TOKEN = "8901851039:AAEiUpCXmaMRP9NP0LuNinncT-Twjido7bA";

let supportPollInterval = null;

function openSupportChat() {
    document.getElementById('support-chat-modal').classList.remove('hidden');
    document.getElementById('support-chat-modal').classList.add('flex');
    loadSupportMessages();
    
    // Start polling every 10 seconds
    if (!supportPollInterval) {
        supportPollInterval = setInterval(loadSupportMessages, 10000);
    }
}

function closeSupportChat() {
    document.getElementById('support-chat-modal').classList.add('hidden');
    document.getElementById('support-chat-modal').classList.remove('flex');
    if (supportPollInterval) {
        clearInterval(supportPollInterval);
        supportPollInterval = null;
    }
}

async function loadSupportMessages() {
    const token = localStorage.getItem('oko_token');
    if (!token) return;
    
    try {
        const res = await fetch(API_URL_AUTH + '?action=support_get', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();
        
        if (data.error) {
            console.error(data.error);
            return;
        }
        
        renderSupportMessages(data);
    } catch (e) {
        console.error('Failed to load support messages', e);
    }
}

function renderSupportMessages(messages) {
    const container = document.getElementById('support-messages-container');
    if (!container) return;
    
    if (!messages || messages.length === 0) {
        container.innerHTML = '<div class="text-center text-slate-400 text-sm mt-10">Здесь будет история вашей переписки.</div>';
        return;
    }
    
    let html = '';
    messages.forEach(msg => {
        const isMe = msg.sender === 'user';
        const date = new Date(msg.created_at).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        
        if (isMe) {
            html += `
                <div class="flex justify-end mb-4">
                    <div class="bg-brand-primary text-white rounded-2xl rounded-tr-sm py-2 px-4 max-w-[85%] shadow-sm">
                        <div class="text-[10px] text-white/70 mb-1 flex justify-between gap-3">
                            <span>Вы (${msg.topic})</span>
                            <span>${date}</span>
                        </div>
                        <div class="text-sm whitespace-pre-wrap leading-relaxed">${msg.message_text}</div>
                    </div>
                </div>
            `;
        } else {
            html += `
                <div class="flex justify-start mb-4">
                    <div class="bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm py-2 px-4 max-w-[85%] border border-slate-200 shadow-sm">
                        <div class="text-[10px] text-slate-500 mb-1 flex justify-between gap-3">
                            <span>Поддержка</span>
                            <span>${date}</span>
                        </div>
                        <div class="text-sm whitespace-pre-wrap leading-relaxed">${msg.message_text}</div>
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;
}

async function sendSupportMessage() {
    const topic = document.getElementById('support-topic').value;
    const textInput = document.getElementById('support-text');
    const text = textInput.value.trim();
    const btn = document.getElementById('support-send-btn');
    
    if (!text) return;
    
    const token = localStorage.getItem('oko_token');
    if (!token) return;
    
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin mx-auto"></i>';
    if (window.lucide) window.lucide.createIcons();
    
    try {
        const res = await fetch(API_URL_AUTH + '?action=support_send', {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ topic, message_text: text })
        });
        const data = await res.json();
        
        if (data.success) {
            textInput.value = '';
            loadSupportMessages(); // Reload immediately
        } else {
            alert(data.error || 'Ошибка отправки сообщения');
        }
    } catch (e) {
        console.error(e);
        alert('Сетевая ошибка');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Отправить';
    }
}
