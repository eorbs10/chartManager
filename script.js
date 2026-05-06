async function fetchTQQQ() {
    const priceEl = document.getElementById('price');
    const timeEl = document.getElementById('time');

    // 요소가 없는 경우를 대비한 방어 코드
    if (!priceEl || !timeEl) return;

    try {
        const response = await fetch('/api/tqqq');
        const data = await response.json();

        if (data.error) throw new Error(data.error);

        const timeSeries = data["Time Series (5min)"];
        if (!timeSeries) throw new Error("데이터 구조를 찾을 수 없습니다.");

        const latestTime = Object.keys(timeSeries)[0];
        const latestData = timeSeries[latestTime];
        const closePrice = parseFloat(latestData["4. close"]).toFixed(2);

        priceEl.innerText = `$${closePrice}`;
        timeEl.innerText = `Update: ${latestTime}`;
        
        console.log("TQQQ 최신가:", closePrice);

    } catch (error) {
        console.error("데이터 로드 실패:", error.message);
        timeEl.innerText = error.message; // 여기서 에러 메시지를 사용자에게 보여줍니다.
    }
}

// 최초 실행 후 1분마다 호출 (분당 5회 한도 준수)
fetchTQQQ();
setInterval(fetchTQQQ, 61000);