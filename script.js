/**
 * script.js - 세로형 실제 차트 버전
 */

const SESSIONS = [
    { id: 'Asia', name: '아시아 장', start: 9 },
    { id: 'Europe', name: '유럽 장', start: 16 },
    { id: 'America', name: '미국 장', start: 22.5 }
];

let refreshInterval = null;
let countdown = 300;

async function fetchTopSymbols() {
    const symbolSelect = document.getElementById('symbol-select');
    const isFutures = document.getElementById('market-type').value === 'FUTURES';
    const url = isFutures ? 'https://fapi.binance.com/fapi/v1/ticker/24hr' : 'https://api.binance.com/api/v3/ticker/24hr';
    try {
        const res = await fetch(url);
        const data = await res.json();
        const filtered = data.filter(t => t.symbol.endsWith('USDT')).sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 10);
        symbolSelect.innerHTML = '';
        filtered.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.symbol; opt.innerText = t.symbol;
            symbolSelect.appendChild(opt);
        });
    } catch (e) { console.error(e); }
}

async function runMarketAnalysis() {
    const symbol = document.getElementById('symbol-select').value;
    if (!symbol) return;
    const isFutures = document.getElementById('market-type').value === 'FUTURES';
    const now = new Date();
    const currentKSTHour = now.getHours() + now.getMinutes() / 60;

    try {
        const pUrl = isFutures ? `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}` : `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
        const nowPrice = parseFloat((await (await fetch(pUrl)).json()).price);

        const k1hUrl = isFutures ? `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=1h&limit=100` : `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1h&limit=100`;
        const k5mUrl = isFutures ? `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=5m&limit=288` : `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=288`;
        const [k1h, k5m] = await Promise.all([fetch(k1hUrl).then(r => r.json()), fetch(k5mUrl).then(r => r.json())]);

        const processedSessions = SESSIONS.map(session => {
            const idx = k1h.findLastIndex(k => (new Date(k[0]).getHours() + new Date(k[0]).getMinutes() / 60) === session.start);
            const candle = k1h[idx];
            const isCompleted = candle && k1h[idx + 1] !== undefined;
            const isActive = currentKSTHour >= session.start && currentKSTHour < (session.start + 8);
            let trajectory = [];
            if (candle) {
                trajectory = k5m.filter(k => k[0] >= candle[0]).map(k => ({ time: new Date(k[0]), price: parseFloat(k[4]) }));
            }
            return { ...session, isCompleted, isActive, candle, trajectory };
        });

        const sorted = [...processedSessions].sort((a, b) => (b.isCompleted - a.isCompleted) || (b.isActive - a.isActive));
        const listElem = document.getElementById('session-list');
        listElem.innerHTML = '';

        sorted.forEach(session => {
            const card = document.createElement('div');
            card.className = `session-card ${session.isActive && session.isCompleted ? 'active' : 'inactive'}`;
            
            if (!session.isCompleted) {
                card.innerHTML = `<div class="session-header"><strong>${session.name}</strong></div><div style="height:100px; display:flex; align-items:center; justify-content:center; color:#555;">데이터 생성 중...</div>`;
            } else {
                const b = { o: parseFloat(session.candle[1]), h: parseFloat(session.candle[2]), l: parseFloat(session.candle[3]) };
                const range = b.h - b.l;
                const minPrice = b.l - range; 
                const maxPrice = b.h + range;

                // 세로 버전 좌표 변환 (Y축이 가격)
                const getY = (price) => 100 - (((price - minPrice) / (maxPrice - minPrice)) * 100);
                // 가로 버전 좌표 변환 (X축이 시간 - 8시간 기준)
                const getX = (time) => {
                    const h = time.getHours() + time.getMinutes() / 60;
                    let diff = (h - session.start);
                    if (diff < 0) diff += 24;
                    return (diff / 8) * 100;
                };

                const points = session.trajectory.map(k => `${getX(k.time)},${getY(k.price)}`).join(' ');

                card.innerHTML = `
                    <div class="session-header">
                        <strong>${session.name}</strong>
                        <small style="color:#888;">${session.start}:00 시작</small>
                    </div>
                    <div class="chart-container">
                        <div class="chart-main">
                            <!-- 시작/고/저 가로선 -->
                            <div class="price-line open" style="top:${getY(b.o)}%;"></div>
                            <div class="price-line high" style="top:${getY(b.h)}%;"></div>
                            <div class="price-line low" style="left:0; top:${getY(b.l)}%;"></div>
                            
                            <!-- 꺾은선 차트 -->
                            <svg class="chart-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <polyline class="path-line" points="${points}" />
                            </svg>

                            <!-- 현재가 수평선 -->
                            <div class="current-price-line" style="top:${getY(nowPrice)}%;"></div>
                        </div>
                        
                        <!-- 우측 가격 레이블 -->
                        <div class="price-sidebar">
                            <div class="price-label-right" style="top:${getY(b.h)}%; color:#ff4444;">HI ${b.h.toFixed(1)}</div>
                            <div class="price-label-right" style="top:${getY(b.o)}%; color:#00ff88;">OP ${b.o.toFixed(1)}</div>
                            <div class="price-label-right" style="top:${getY(b.l)}%; color:#4444ff;">LO ${b.l.toFixed(1)}</div>
                            <div class="current-price-tag" style="top:${getY(nowPrice)}%;">${nowPrice.toFixed(1)}</div>
                        </div>
                    </div>
                `;
            }
            listElem.appendChild(card);
        });
        countdown = 300;
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchTopSymbols();
    document.getElementById('market-type').onchange = fetchTopSymbols;
    document.getElementById('start-btn').onclick = () => {
        document.body.classList.add('active-analysis');
        document.getElementById('current-symbol-title').innerText = document.getElementById('symbol-select').value;
        runMarketAnalysis();
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            countdown--;
            document.getElementById('timer-text').innerText = `갱신: ${Math.floor(countdown/60)}:${(countdown%60).toString().padStart(2,'0')}`;
            if (countdown <= 0) runMarketAnalysis();
        }, 1000);
    };
    document.getElementById('back-btn').onclick = () => {
        document.body.classList.remove('active-analysis');
        clearInterval(refreshInterval);
    };
});