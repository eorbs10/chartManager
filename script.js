// script.js
async function fetchTQQQ() {
    const priceEl = document.getElementById('price');
    const timeEl = document.getElementById('time');

    try {
        // 배포 후에는 Vercel 서버의 /api/tqqq 경로를 호출합니다.
        const response = await fetch('/api/tqqq');
        
        // 응답이 JSON이 아닐 경우(404 등)를 대비한 체크
        if (!response.ok) throw new Error(`HTTP 에러! 상태: ${response.status}`);
        
        const data = await response.json();
        const timeSeries = data["Time Series (5min)"];
        
        if (!timeSeries) throw new Error("API 한도 초과 또는 키 설정 오류");

        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];

        priceEl.innerText = `$${parseFloat(latestData["4. close"]).toFixed(2)}`;
        timeEl.innerText = `마지막 업데이트: ${latestTime}`;
        
        console.log("실시간 데이터 수신 성공:", latestData);

    } catch (error) {
        console.error("데이터 로드 실패:", error);
        timeEl.innerText = "연결 실패 (Vercel 배포 확인 필요)";
        timeEl.style.color = "#ff4444";
    }
}

// 최초 실행 및 1분마다 갱신
fetchTQQQ();
setInterval(fetchTQQQ, 60000);