// api/tqqq.js
export default async function handler(req, res) {
  // Vercel Settings -> Environment Variables에 등록된 키를 사용
  const API_KEY = process.env.ALPHA_VANTAGE_KEY; 
  const symbol = "TQQQ";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Alpha Vantage 무료 제한(분당 5회)에 걸렸을 경우 처리
    if (data["Note"]) {
      return res.status(429).json({ error: "API 한도 초과 (1분 뒤 시도하세요)" });
    }

    // CORS 허용 및 JSON 데이터 반환
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "서버 통신 실패" });
  }
}