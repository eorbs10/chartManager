// script.js
async function fetchTQQQ() {
    const priceEl = document.getElementById('price');
    const timeEl = document.getElementById('last-time');
    const statusEl = document.getElementById('status');

    // HTML 요소 확인
    if (!priceEl || !timeEl || !statusEl) return;

    try {
        // Vercel 서버리스 함수 호출
        const response = await fetch('/api/tqqq');
        const data = await response.json();

        // 에러 응답 확인
        if (data.error) {
            throw new Error(data.error);
        }

        const timeSeries = data["Time Series (5min)"];
        
        if (!timeSeries) {
            throw new Error("데이터 구조를 찾을 수 없습니다.");
        }

        // 최신 데이터 추출
        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];
        const closePrice = parseFloat(latestData["4. close"]).toFixed(2);

        // 화면 업데이트
        priceEl.innerText = `$${closePrice}`;
        timeEl.innerText = `시간: ${latestTime}`;
        statusEl.innerText = `업데이트: ${new Date().toLocaleTimeString()}`;
        statusEl.classList.remove('error-text');

        console.log("TQQQ 실시간 데이터:", latestData);

    } catch (error) {
        console.error("오류 발생:", error.message);
        statusEl.innerText = `오류: ${error.message}`;
        statusEl.classList.add('error-text');
    }
}

// 최초 실행
fetchTQQQ();

// Alpha Vantage 무료 티어 한도를 고려해 1분(61초)마다 실행
setInterval(fetchTQQQ, 61000);