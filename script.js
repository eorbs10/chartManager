// script.js
async function fetchTQQQ4H() {
    const priceEl = document.getElementById('price');
    const debugEl = document.getElementById('debug-log');

    try {
        const response = await fetch('/api/tqqq');
        const data = await response.json();
        debugEl.innerText = JSON.stringify(data, null, 2);

        const hourlyData = data["Time Series (60min)"];
        if (!hourlyData) return;

        const timestamps = Object.keys(hourlyData);
        // 최신 1시간봉 데이터
        const latestHour = hourlyData[timestamps[0]];
        const currentPrice = parseFloat(latestHour["4. close"]).toFixed(2);

        // [4시간봉 합성 로직 예시]
        // 4개의 캔들을 순회하며 High/Low/Volume을 합산하여 4시간 단위 데이터를 생성할 수 있습니다.
        
        priceEl.innerText = `$${currentPrice}`;
        document.getElementById('status').innerText = `TQQQ 60분봉 기준 (4H 합성 대기 중)`;

    } catch (e) {
        console.error(e);
    }
}

fetchTQQQ4H();