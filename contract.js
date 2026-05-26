
// ===================== CONTRACT GENERATOR =====================

function openContractModal() {
    // Автозаполнение из полей калькулятора
    let kpNum = (document.getElementById('kp-number-input')?.value || '').trim();
    let clientName = (document.getElementById('client-name')?.value || '').trim();

    if (kpNum) document.getElementById('contract-number').value = kpNum;
    if (kpNum) document.getElementById('contract-kp-number').value = kpNum;
    if (clientName) document.getElementById('contract-client-name').value = clientName;

    // Дата — сегодня
    let today = new Date();
    let todayISO = today.toISOString().split('T')[0];
    document.getElementById('contract-date').value = todayISO;
    document.getElementById('contract-kp-date').value = todayISO;

    // Итоговая сумма из калькулятора
    try {
        let totals = calculateTotals();
        if (totals && totals.finalTotal > 0) {
            document.getElementById('contract-total-sum').value = totals.finalTotal;
            // Предоплата заполняется вручную
        }
    } catch(e) { console.warn('Не удалось подтянуть итого:', e); }

    // Показываем модал с анимацией
    let overlay = document.getElementById('contract-modal-overlay');
    let modal = document.getElementById('contract-modal');
    overlay.style.display = 'block';
    modal.style.display = 'flex';
    // Перерисовка иконок Lucide в модале
    if (typeof lucide !== 'undefined') lucide.createIcons();
    requestAnimationFrame(() => {
        overlay.style.opacity = '1';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    });
}

function closeContractModal() {
    let overlay = document.getElementById('contract-modal-overlay');
    let modal = document.getElementById('contract-modal');
    overlay.style.opacity = '0';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => {
        overlay.style.display = 'none';
        modal.style.display = 'none';
        // Скрыть статус
        document.getElementById('contract-status').classList.add('hidden');
    }, 300);
}

function setContractPrepayment(pct) {
    let totalStr = document.getElementById('contract-total-sum').value || '';
    // Убираем пробелы и переводим в число (если есть запятая, меняем на точку)
    let cleanStr = totalStr.replace(/\s+/g, '').replace(/\u00A0/g, '').replace(/&nbsp;/g, '').replace(',', '.');
    // Удаляем всё, кроме цифр и точки
    cleanStr = cleanStr.replace(/[^0-9.]/g, '');
    let totalVal = parseFloat(cleanStr) || 0;
    if (totalVal > 0) {
        document.getElementById('contract-prepayment').value = Math.ceil(totalVal * pct / 100);
    }
}

function _contractFormatDateRu(isoStr) {
    if (!isoStr) return '\u00ab___\u00bb ____________ 202_ г.';
    let parts = isoStr.split('-');
    let months = ['января','февраля','марта','апреля','мая','июня',
                   'июля','августа','сентября','октября','ноября','декабря'];
    let day = parseInt(parts[2], 10);
    let month = months[parseInt(parts[1], 10) - 1] || '';
    let year = parts[0];
    return '\u00ab' + day + '\u00bb ' + month + ' ' + year + ' г.';
}

function _contractShowStatus(msg, isError) {
    let el = document.getElementById('contract-status');
    el.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'bg-emerald-50', 'text-emerald-700');
    if (isError) {
        el.classList.add('bg-red-50', 'text-red-700');
    } else {
        el.classList.add('bg-emerald-50', 'text-emerald-700');
    }
    el.textContent = msg;
}

async function generateContractDocx() {
    // Собираем значения из формы
    let contractNumber = document.getElementById('contract-number').value.trim() || '____';
    let contractDate = document.getElementById('contract-date').value;
    let clientName = document.getElementById('contract-client-name').value.trim() || '________________';
    let clientPassport = document.getElementById('contract-client-passport').value.trim() || '________________';
    let clientBirthdateRaw = document.getElementById('contract-client-birthdate').value;
    let clientBirthdate = clientBirthdateRaw ? _contractFormatDateRu(clientBirthdateRaw) : '________________';
    let clientAddress = document.getElementById('contract-client-address').value.trim();
    let clientPhone = document.getElementById('contract-client-phone').value.trim() || '________________';
    let totalSum = document.getElementById('contract-total-sum').value.trim() || '0';
    let prepayment = document.getElementById('contract-prepayment').value.trim() || '0';
    let kpNumber = document.getElementById('contract-kp-number').value.trim() || contractNumber;
    let kpDate = document.getElementById('contract-kp-date').value;
    let startDate = document.getElementById('contract-start-date').value;
    let endDate = document.getElementById('contract-end-date').value;

    // Валидация
    if (!clientName) {
        _contractShowStatus('\u26a0\ufe0f Укажите ФИО заказчика!', true);
        document.getElementById('contract-client-name').focus();
        return;
    }
    if (!clientAddress) {
        _contractShowStatus('\u26a0\ufe0f Укажите адрес объекта!', true);
        document.getElementById('contract-client-address').focus();
        return;
    }

    _contractShowStatus('\u23f3 Генерация договора...', false);

    try {
        // Загружаем шаблон из встроенного Base64
        function base64ToArrayBuffer(base64) {
            let binaryString = window.atob(base64);
            let binaryLen = binaryString.length;
            let bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }
        if (typeof contractTemplateBase64 === 'undefined') {
            throw new Error('Файл contract_template_base64.js не подключен или шаблон не найден.');
        }
        let arrayBuffer = base64ToArrayBuffer(contractTemplateBase64);

        // Распаковка ZIP
        let zip = new PizZip(arrayBuffer);

        // Создаём docxtemplater с шаблоном
        let doc = new window.docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: { start: '{', end: '}' }
        });

        // Функция для конвертации числа в слова
        function numberToWordsRu(num) {
            const units = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
            const unitsFem = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
            const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
            const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
            const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

            function getForm(n, form1, form2, form5) {
                let n100 = Math.abs(n) % 100;
                let n10 = n100 % 10;
                if (n100 > 10 && n100 < 20) return form5;
                if (n10 > 1 && n10 < 5) return form2;
                if (n10 === 1) return form1;
                return form5;
            }

            function parseGroup(n, gender, form1, form2, form5) {
                if (n === 0) return '';
                let result = [];
                let h = Math.floor(n / 100);
                let t = Math.floor((n % 100) / 10);
                let u = n % 10;
                
                if (h > 0) result.push(hundreds[h]);
                if (t === 1) {
                    result.push(teens[u]);
                } else {
                    if (t > 1) result.push(tens[t]);
                    if (u > 0) {
                        if (gender === 'fem') result.push(unitsFem[u]);
                        else result.push(units[u]);
                    }
                }
                
                result.push(getForm(n, form1, form2, form5));
                return result.join(' ');
            }

            let intPart = Math.floor(num);
            let decPart = Math.round((num - intPart) * 100);
            
            if (intPart === 0) {
                return 'ноль';
            }

            let result = [];
            let billions = Math.floor(intPart / 1000000000);
            let millions = Math.floor((intPart % 1000000000) / 1000000);
            let thousands = Math.floor((intPart % 1000000) / 1000);
            let unitsGrp = intPart % 1000;

            if (billions > 0) result.push(parseGroup(billions, 'masc', 'миллиард', 'миллиарда', 'миллиардов'));
            if (millions > 0) result.push(parseGroup(millions, 'masc', 'миллион', 'миллиона', 'миллионов'));
            if (thousands > 0) result.push(parseGroup(thousands, 'fem', 'тысяча', 'тысячи', 'тысяч'));
            if (unitsGrp > 0) result.push(parseGroup(unitsGrp, 'masc', '', '', ''));

            let words = result.join(' ').trim();
            words = words.replace(/\s+/g, ' ');
            return words.charAt(0).toLowerCase() + words.slice(1);
        }

        function formatSumWithWords(sumStr) {
            if (!sumStr) return '0 рублей';
            let str = sumStr.toString();
            // Убираем пробелы, неразрывные пробелы
            let cleanStr = str.replace(/\s+/g, '').replace(/\u00A0/g, '').replace(/&nbsp;/g, '');
            // Меняем запятую на точку
            cleanStr = cleanStr.replace(',', '.');
            // Убираем всё кроме цифр и точек
            cleanStr = cleanStr.replace(/[^0-9.]/g, '');
            
            // Если несколько точек, оставляем только последнюю
            let parts = cleanStr.split('.');
            if (parts.length > 2) {
                cleanStr = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
            } else if (parts.length === 2 && parts[1].length === 3) {
                // Если формат 70.000 (одна точка и ровно три цифры после неё) — это разделитель тысяч
                cleanStr = parts[0] + parts[1];
            }

            let val = parseFloat(cleanStr) || 0;
            
            let intPart = Math.floor(val);
            let decPart = Math.round((val - intPart) * 100);
            let decStr = decPart < 10 ? '0' + decPart : decPart;
            
            let formattedNum = intPart.toLocaleString('ru-RU') + '.' + decStr;
            let words = numberToWordsRu(val);
            
            // Определяем правильную форму слова "рубль"
            let rubWord = "рублей";
            let n100 = Math.abs(intPart) % 100;
            let n10 = n100 % 10;
            if (n100 > 10 && n100 < 20) rubWord = "рублей";
            else if (n10 > 1 && n10 < 5) rubWord = "рубля";
            else if (n10 === 1) rubWord = "рубль";
            
            let kopWord = "копеек";
            let k100 = Math.abs(decPart) % 100;
            let k10 = k100 % 10;
            if (k100 > 10 && k100 < 20) kopWord = "копеек";
            else if (k10 > 1 && k10 < 5) kopWord = "копейки";
            else if (k10 === 1) kopWord = "копейка";

            let fullWords = `${words} ${rubWord} ${decStr} ${kopWord}`.trim();
            fullWords = fullWords.charAt(0).toLowerCase() + fullWords.slice(1);
            
            return `${formattedNum} ${rubWord} (${fullWords})`;
        }

        // Форматируем суммы с прописью
        let totalSumFormatted = formatSumWithWords(totalSum);
        let prepaymentFormatted = formatSumWithWords(prepayment);

        // Подставляем данные
        doc.render({
            contract_number: contractNumber,
            contract_date: _contractFormatDateRu(contractDate),
            client_name: clientName,
            client_passport: clientPassport,
            client_birthdate: clientBirthdate,
            client_address: clientAddress,
            client_phone: clientPhone,
            total_sum: totalSumFormatted,
            prepayment_sum: prepaymentFormatted,
            kp_number: kpNumber,
            kp_date: _contractFormatDateRu(kpDate),
            start_date: _contractFormatDateRu(startDate),
            end_date: _contractFormatDateRu(endDate)
        });

        // Генерируем файл
        let output = doc.getZip().generate({
            type: 'blob',
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        // Скачиваем
        let link = document.createElement('a');
        link.href = URL.createObjectURL(output);
        let safeName = clientName.replace(/[^a-zа-яё0-9\s]/gi, '').trim().replace(/\s+/g, '_') || 'Заказчик';
        link.download = 'Договор_' + safeName + '_' + contractNumber + '.docx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        _contractShowStatus('\u2705 Договор успешно сгенерирован и скачан!', false);

    } catch (e) {
        console.error('Ошибка генерации договора:', e);
        _contractShowStatus('\u274c Ошибка: ' + e.message, true);
    }
}
