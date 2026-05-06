// 차트 설정 및 초기화
const chartElement = document.getElementById('chart');
const chart = LightweightCharts.createChart(chartElement, {
    layout: {
        background: { type: 'solid', color: '#0b0e11' },
        textColor: '#d1d4dc',
    },
    grid: {
        vertLines: { color: '#1f2226' },
        horzLines: { color: '#1f2226' },
    },
    timeScale: {
        timeVisible: true,
        secondsVisible: false,
    },
});

// 캔들스틱 시리즈 추가
const candleSeries = chart.addSeries(LightweightCharts.CandlestickSeries, {
    upColor: '#02c076',
    downColor: '#cf304a',
    borderVisible: false,
    wickUpColor: '#02c076',
    wickDownColor: '#cf304a',
});

/**
 * Vercel Serverless Function(/api/tqqq)을 통해 데이터를 가져옵니다.
 */
async function fetchTQQQData() {
    const statusEl = document.getElementById('status');
    const priceEl = document.getElementById('current-price');

    try {
        // Vercel 배포 시 /api/tqqq.js 경로가 이 주소가 됩니다.
        const response = await fetch('/api/tqqq');
        const data = await response.json();

        // Alpha Vantage 데이터 파싱
        const timeSeries = data["Time Series (5min)"];
        
        if (!timeSeries) {
            throw new Error(data["Note"] || data["Error Message"] || "데이터 형식이 올바르지 않습니다.");
        }

        const chartData = [];
        for (let time in timeSeries) {
            chartData.push({
                time: new Date(time).getTime() / 1000,
                open: parseFloat(timeSeries[time]["1. open"]),
                high: parseFloat(timeSeries[time]["2. high"]),
                low: parseFloat(timeSeries[time]["3. low"]),
                close: parseFloat(timeSeries[time]["4. close"]),
            });
        }

        // 차트는 시간 오름차순이어야 함
        chartData.sort((a, b) => a.time - b.time);

        // 데이터 세팅
        candleSeries.setData(chartData);
        
        // 최신 가격 표시
        const latestPrice = chartData[chartData.length - 1].close;
        priceEl.innerText = `$${latestPrice.toFixed(2)}`;
        statusEl.innerText = `마지막 업데이트: ${new Date().toLocaleTimeString()}`;
        
        // 차트 범위를 데이터에 맞춤
        chart.timeScale().fitContent();

    } catch (error) {
        console.error("데이터 로드 실패:", error);
        statusEl.innerText = "API 호출 제한 또는 서버 오류";
        statusEl.style.color = "#cf304a";
    }
}

// 윈도우 크기 조절 시 차트 리사이징
window.addEventListener('resize', () => {
    chart.applyOptions({ width: chartElement.clientWidth, height: chartElement.clientHeight });
});

// 최초 실행 및 1분마다 갱신 (Alpha Vantage 무료 키 제한 고려)
fetchTQQQData();
setInterval(fetchTQQQData, 60000);