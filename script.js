let chartInstance = null;

// 1. 거래량 상위 10개 가져오기
async function fetchTopVolume() {
    const marketType = document.getElementById('marketType').value;
    const listContainer = document.getElementById('listContainer');
    listContainer.innerHTML = '로딩 중...';

    // 현물 vs 선물 API 엔드포인트 구분
    const url = marketType === 'SPOT' 
        ? 'https://api.binance.com/api/v3/ticker/24hr' 
        : 'https://fapi.binance.com/fapi/v1/ticker/24hr';

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        // 거래량(quoteVolume) 기준 내림차순 정렬 후 10개 추출
        const top10 = data
            .sort((a, b) => b.quoteVolume - a.quoteVolume)
            .slice(0, 10);

        listContainer.innerHTML = '';
        top10.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.symbol} (거래량: ${Number(item.quoteVolume).toLocaleString()})`;
            li.onclick = () => showChart(item.symbol, marketType);
            listContainer.appendChild(li);
        });
    } catch (error) {
        listContainer.innerHTML = '데이터를 불러오지 못했습니다.';
    }
}

// 2. 4시간 봉 (3일치) 데이터 가져오기 및 분석
async function showChart(symbol, marketType) {
    document.getElementById('setupPage').classList.add('hidden');
    document.getElementById('chartPage').classList.remove('hidden');
    document.getElementById('selectedSymbol').textContent = symbol;

    const url = marketType === 'SPOT'
        ? `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=4h&limit=18` // 3일 = 72시간 / 4시간 = 18개
        : `https://fapi.binance.com/fapi/v1/klines?symbol=${symbol}&interval=4h&limit=18`;

    try {
        const response = await fetch(url);
        const candles = await response.json();

        // 고가(index 2)와 저가(index 3) 추출
        const highs = candles.map(c => parseFloat(c[2]));
        const lows = candles.map(c => parseFloat(c[3]));
        const labels = candles.map(c => new Date(c[0]).toLocaleString());
        const closePrices = candles.map(c => parseFloat(c[4]));

        const maxPrice = Math.max(...highs);
        const minPrice = Math.min(...lows);

        document.getElementById('statsText').innerHTML = `
            <b>최근 3일 분석 (4시간 봉 기준)</b><br>
            최고점: <span style="color:red">${maxPrice}</span> / 
            최저점: <span style="color:blue">${minPrice}</span>
        `;

        renderChart(labels, closePrices);
    } catch (error) {
        console.error(error);
    }
}

function renderChart(labels, data) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '종가 (Close Price)',
                data: data,
                borderColor: '#2ecc71',
                tension: 0.1
            }]
        }
    });
}

function backToMain() {
    document.getElementById('setupPage').classList.remove('hidden');
    document.getElementById('chartPage').classList.add('hidden');
}