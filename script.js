/**
 * TQQQ 데이터를 불러와서 화면에 표시하는 함수
 */
async function getTQQQData() {
    const statusEl = document.getElementById('status');
    const timeEl = document.getElementById('last-time');
    const closeEl = document.getElementById('last-close');
    const highEl = document.getElementById('last-high');
    const jsonEl = document.getElementById('raw-json');

    try {
        // Vercel 서버리스 함수 호출
        const response = await fetch('/api/tqqq');
        const data = await response.json();

        // Alpha Vantage 응답 구조에서 5분봉 시계열 데이터 추출
        const timeSeries = data["Time Series (5min)"];

        if (!timeSeries) {
            // API 키 제한이나 오류 메시지 처리
            const errorMsg = data["Note"] || data["Error Message"] || "데이터를 찾을 수 없습니다.";
            throw new Error(errorMsg);
        }

        // 가장 최근 시간(첫 번째 키) 가져오기
        const timestamps = Object.keys(timeSeries);
        const latestTime = timestamps[0];
        const latestData = timeSeries[latestTime];

        // 1. 화면 텍스트 업데이트
        timeEl.innerText = latestTime;
        closeEl.innerText = `$${parseFloat(latestData["4. close"]).toFixed(2)}`;
        highEl.innerText = `$${parseFloat(latestData["2. high"]).toFixed(2)}`;

        // 2. Raw JSON 영역에 마지막 캔들 정보 표시
        jsonEl.innerText = JSON.stringify({
            time: latestTime,
            ...latestData
        }, null, 2);

        // 3. 콘솔에 전체 데이터 출력 (디버깅용)
        console.log("TQQQ 전체 시계열 데이터:", timeSeries);

        statusEl.innerText = `✅ 업데이트 성공: ${new Date().toLocaleTimeString()}`;
        statusEl.style.color = "#00ff88";

    } catch (error) {
        console.error("데이터 로드 실패:", error);
        statusEl.innerText = `❌ 오류: ${error.message}`;
        statusEl.style.color = "#ff4444";
        jsonEl.innerText = "데이터를 불러오는 데 실패했습니다.";
    }
}

// 최초 실행
getTQQQData();

// Alpha Vantage 무료 티어 제한(분당 5회)을 고려하여 1분(60초)마다 갱신
setInterval(getTQQQData, 60000);