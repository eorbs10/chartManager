const SESSIONS = [
    { id: 'Asia', name: 'ASIA', start: 9, class: 'card-asia' },
    { id: 'Europe', name: 'EUROPE', start: 16, class: 'card-europe' },
    { id: 'America', name: 'AMERICA', start: 22.5, class: 'card-america' }
];

let refreshInterval = null;

async function fetchTopSymbols() {
    const symbolSelect = document.getElementById('symbol-select');
    const marketType = document.getElementById('market-type').value;
    const isFutures = marketType === 'FUTURES';
    const url = isFutures ? `https://fapi.binance.com/fapi/v1/ticker/24hr?t=${Date.now()}` : `https://api.binance.com/api/v3/ticker/24hr?t=${Date.now()}`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        const filtered = data.filter(t => t.symbol.endsWith('USDT')).sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume)).slice(0, 10);
        symbolSelect.innerHTML = '';
        filtered.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.symbol; opt.innerText = t.symbol;
            symbolSelect.appendChild(opt);
        });
    } catch (e) { 
        setTimeout(fetchTopSymbols, 3000);
    }
}

function generateSidebarHTML(b, nowPrice, isLive, min, max, getY) {
    return `
        <div class="price-sidebar">
            <div class="label-left" style="top:2%; color:var(--limit);">MAX ${max.toFixed(2)}</div>
            <div class="label-left" style="top:${getY(b.h)}%; color:var(--down);">HI ${b.h.toFixed(2)}</div>
            <div class="label-left" style="top:${getY(b.o)}%; color:var(--up);">OP ${b.o.toFixed(2)}</div>
            <div class="label-left" style="top:${getY(b.l)}%; color:#4444ff;">LO ${b.l.toFixed(2)}</div>
            <div class="label-left" style="top:98%; color:var(--limit);">MIN ${min.toFixed(2)}</div>
            ${isLive ? `<div class="current-price-tag" style="top:${getY(nowPrice)}%;">${nowPrice.toFixed(2)}</div>` : ''}
        </div>
    `;
}

function getXPercent(targetTime, sessionStartHour) {
    const kTime = new Date(targetTime);
    let kHour = kTime.getHours() + kTime.getMinutes() / 60;
    if (kHour < sessionStartHour - 4) { kHour += 24; }
    const diff = kHour - sessionStartHour;
    return (diff / 8) * 100;
}

async function runMarketAnalysis() {
    const symbol = document.getElementById('symbol-select').value;
    if (!symbol) return;
    const isFutures = document.getElementById('market-type').value === 'FUTURES';
    const now = new Date();
    const currentKSTHour = now.getHours() + now.getMinutes() / 60;

    try {
        const t = Date.now();
        const pUrl = isFutures ? `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}&t=${t}` : `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}&t=${t}`;
        const pData = await (await fetch(pUrl)).json();
        const nowPrice = parseFloat(pData.price);

        // 미국장 누락 방지: 검색 범위를 1000시간으로 대폭 확대
        const k1hUrl = isFutures ? `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=1000` : `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=1000`;
        const k5mUrl = isFutures ? `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=5m&limit=1000` : `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=1000`;
        const [k1h, k5m] = await Promise.all([fetch(k1hUrl).then(r => r.json()), fetch(k5mUrl).then(r => r.json())]);

        const processedSessions = SESSIONS.map(session => {
            // 과거 데이터에서 세션 시작 시간과 일치하는 캔들을 역순으로 검색
            const idx = k1h.findLastIndex(k => {
                const kHour = new Date(k[0]).getHours() + new Date(k[0]).getMinutes() / 60;
                return kHour === session.start;
            });
            const candle = k1h[idx];
            
            let status = 'closed';
            let checkHour = currentKSTHour;
            if (checkHour < session.start - 4) checkHour += 24;
            if (checkHour >= session.start && checkHour < (session.start + 8)) { status = 'live'; }
            else if (checkHour < session.start) { status = 'upcoming'; }
            
            let trajectory = [];
            if (candle) {
                const startT = candle[0];
                const endT = startT + (8 * 60 * 60 * 1000);
                trajectory = k5m.filter(k => k[0] >= startT && k[0] <= endT).map(k => ({ time: k[0], price: parseFloat(k[4]) }));
            }
            return { ...session, status, candle, trajectory };
        });

        // LIVE인 세션을 최상단으로 올리고 나머지는 순차적으로 정렬 (로테이션)
        const sortedSessions = [...processedSessions].sort((a, b) => {
            if (a.status === 'live') return -1;
            if (b.status === 'live') return 1;
            return 0; 
        });

        const listElem = document.getElementById('session-list');
        listElem.innerHTML = '';
        sortedSessions.forEach(s => {
            if (!s.candle) return;
            const b = { o: parseFloat(s.candle[1]), h: parseFloat(s.candle[2]), l: parseFloat(s.candle[3]) };
            const range = b.h - b.l;
            const min = b.l - range; const max = b.h + range;
            const getY = (p) => 100 - (((p - min) / (max - min)) * 100);
            const points = s.trajectory.map((k) => `${getXPercent(k.time, s.start)},${getY(k.price)}`).join(' ');

            const card = document.createElement('div');
            card.className = `session-card ${s.class} card-${s.status}`;
            card.innerHTML = `
                <div class="status-overlay"></div>
                <div class="session-header" style="position:relative; z-index:2;"><strong>${s.name}</strong> <small>${s.status.toUpperCase()}</small></div>
                <div class="chart-container">
                    <div class="chart-main">
                        <div class="price-line limit" style="top:0%;"></div>
                        <div class="price-line high" style="top:${getY(b.h)}%;"></div>
                        <div class="price-line open" style="top:${getY(b.o)}%;"></div>
                        <div class="price-line low" style="top:${getY(b.l)}%;"></div>
                        <div class="price-line limit" style="top:100%;"></div>
                        <svg class="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none"><polyline class="path-line" points="${points}" /></svg>
                        ${s.status === 'live' ? `<div class="current-price-line" style="top:${getY(nowPrice)}%;"></div>` : ''}
                    </div>
                    ${generateSidebarHTML(b, nowPrice, s.status === 'live', min, max, getY)}
                </div>
            `;
            listElem.appendChild(card);
        });
    } catch (e) { console.error(e); }
}

function syncTimer() {
    const timerElem = document.getElementById('timer-text');
    if (!timerElem) return;
    const now = new Date();
    const min = now.getMinutes(); const sec = now.getSeconds();
    const nextBoundary = Math.ceil((min + (sec > 0 ? 0.01 : 0)) / 5) * 5;
    let rM = (nextBoundary - min - 1); let rS = 60 - sec;
    if (rS === 60) { rS = 0; rM += 1; }
    if (rM === 0 && rS === 0) runMarketAnalysis();
    else timerElem.innerText = `NEXT SYNC: ${rM.toString().padStart(2, '0')}:${rS.toString().padStart(2, '0')}`;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTopSymbols();
    document.getElementById('market-type').onchange = fetchTopSymbols;
    document.getElementById('start-btn').onclick = () => {
        const symbol = document.getElementById('symbol-select').value;
        if (!symbol) return;
        document.body.classList.add('active-analysis');
        document.getElementById('current-symbol-title').innerText = symbol;
        runMarketAnalysis();
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(syncTimer, 1000);
    };
    document.getElementById('back-btn').onclick = () => {
        document.body.classList.remove('active-analysis');
        clearInterval(refreshInterval);
    };
});