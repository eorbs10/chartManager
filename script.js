// script.js
async function fetchTQQQ() {
    const priceEl = document.getElementById('price');
    const statusEl = document.getElementById('status');
    const debugEl = document.getElementById('debug-log');

    try {
        const response = await fetch('/api/tqqq');
        const data = await response.json();

        // 1. 서버 응답을 무조건 화면에 출력 (이게 핵심 디버깅입니다)
        debugEl.innerText = JSON.stringify(data, null, 2);

        // 2. Alpha Vantage 특유의 한도 제한 메시지 체크
        if (data["Note"]) {
            statusEl.innerText = "⚠️ API 호출 한도 초과 (1분 뒤 자동 재시도)";
            return;
        }

        // 3. 실제 시계열 데이터가 있는지 확인
        const timeSeries = data["Time Series (5min)"];
        if (!timeSeries) {
            statusEl.innerText = "❌ 데이터 구조 없음 (Raw JSON 확인 필요)";
            return;
        }

        // 4. 데이터 표시
        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];
        const price = parseFloat(latestData["4. close"]).toFixed(2);

        priceEl.innerText = `$${price}`;
        statusEl.innerText = `성공: ${latestTime}`;
        statusEl.style.color = "#02c076";

    } catch (error) {
        debugEl.innerText = `에러 발생: ${error.message}`;
        statusEl.innerText = "연결 실패";
    }
}

fetchTQQQ();
setInterval(fetchTQQQ, 65000); // 무료 한도 보호를 위해 65초 주기