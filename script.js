// script.js
async function fetchTQQQ() {
    const priceEl = document.getElementById('price-display');
    const timeEl = document.getElementById('time-display');
    const errorEl = document.getElementById('error-display');
    const statusEl = document.getElementById('update-status');

    try {
        const response = await fetch('/api/tqqq');
        const data = await response.json();

        // 1. 서버 에러 발생 시 처리 (한도 초과 등)
        if (data.error) {
            throw new Error(data.message || data.error);
        }

        const timeSeries = data["Time Series (5min)"];
        
        // 2. 데이터 구조가 없는 경우 (API 호출 실패 등)
        if (!timeSeries) {
            console.log("Raw Data Check:", data); // 원본 확인용
            throw new Error("데이터 구조를 찾을 수 없습니다. (콘솔 확인)");
        }

        // 3. 정상 데이터 파싱
        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];
        const closePrice = parseFloat(latestData["4. close"]).toFixed(2);

        // 화면 업데이트
        priceEl.innerText = `$${closePrice}`;
        timeEl.innerText = `기준 시간: ${latestTime}`;
        statusEl.innerText = `마지막 성공: ${new Date().toLocaleTimeString()}`;
        errorEl.style.display = 'none';

    } catch (error) {
        console.error("Fetch Error:", error.message);
        errorEl.innerText = `⚠️ ${error.message}`;
        errorEl.style.display = 'block';
        statusEl.innerText = "데이터 갱신 대기 중...";
    }
}

// 최초 실행
fetchTQQQ();

// 무료 한도(분당 5회)를 고려하여 1분(65초)마다 자동 갱신
setInterval(fetchTQQQ, 65000);