// ==========================================
// GLOBALS & STATE — Все цены ДИЛЕРСКИЕ
// ==========================================
// Глобальная защита: PHP может отдать объект вместо массива (если удалялись позиции).
// Эта функция конвертирует объект обратно в массив.
function ensureArray(val) {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') return Object.values(val);
    return [];
}
let GLASS_TYPES = [];
let RAW_GLASS_TYPES = [];
let SANDWICH_TYPES = [];
let HARDWARE_TYPES = [];
let BLINDS_TYPES = [];

let SHAPES = [];
let LAYOUTS = [];
let NET_TYPES = [];

let SALINOX_PRICES = {};
let OPTIONS = [];
let SILLS_DATA = [];
let SLOPES_DATA = [];
const SLOPES_LENGTHS = [1.0, 1.3, 1.5, 1.7, 2.0, 2.5]; // Метры
let SLOPES_PROF_PRICES = {};
let PARTITION_PRICES = {};
let MOUNT_PRICES = {};
let PRESET_SERVICES_DB = [];

function toggleFlOptions() {
    const sys = document.getElementById('fl-system');
    if(!sys) return;
    const isPartition = sys.value === 'partition';
    const partSet = document.getElementById('fl-partition-settings');
    const salSet = document.getElementById('fl-salinox-settings');
    if (partSet) partSet.classList.toggle('hidden', !isPartition);
    if (salSet) salSet.classList.toggle('hidden', isPartition);
    if (isPartition && typeof updatePartitionDoorsConfig === 'function') {
        updatePartitionDoorsConfig();
    }
}

// --- ROLLERS (Роллеты) DATA ---
const ROLLERS_DATA = {
    'Alutech': ['38 (PD/39)', '45 (PD/45)', '55 (PD/55)', '60 (AER/60)', '70 (AER/70)'],
    'DoorHan': ['45 (RH45)', '58 (RH58)', '60 (RHE60)', '70 (RHE70)']
};

// --- BLINDS (Жалюзи) DATA ---
const BLINDS_UNI1_WIDTHS = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150]; // см
const BLINDS_UNI1_HEIGHTS = [40, 60, 80, 100, 120, 140, 160, 180]; // см
const BLINDS_UNI1_GRID = [
    [660, 760, 840, 920, 1010, 1080, 1200, 1270, 1330, 1430, 1530, 1620, 1660],
    [740, 830, 920, 980, 1100, 1170, 1250, 1330, 1430, 1500, 1580, 1660, 1750],
    [830, 880, 980, 1080, 1110, 1230, 1330, 1430, 1500, 1540, 1660, 1750, 1820],
    [910, 950, 1080, 1130, 1230, 1290, 1400, 1500, 1540, 1620, 1750, 1820, 1890],
    [950, 1050, 1130, 1230, 1290, 1360, 1460, 1540, 1620, 1670, 1820, 1890, 1950],
    [1050, 1130, 1200, 1290, 1360, 1430, 1540, 1620, 1670, 1760, 1890, 1950, 2050],
    [1130, 1200, 1230, 1360, 1430, 1530, 1620, 1670, 1760, 1890, 1950, 2050, 2130],
    [1200, 1230, 1360, 1430, 1530, 1600, 1670, 1760, 1890, 1950, 2050, 2130, 2210]
];
let BLINDS_FABRICS = [];