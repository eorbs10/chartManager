// api/tqqq.js
export default async function handler(req, res) {
  // Vercel Settings -> Environment Variables에 등록된 키 사용
  const API_KEY = process.env.ALPHA_VANTAGE_KEY; 
  const symbol = "TQQQ";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Alpha Vantage 무료 제한(분당 5회) 메시지 체크
    if (data["Note"]) {
      return res.status(429).json({ 
        error: "API 한도 초과", 
        message: "분당 5회 제한입니다. 1분 뒤 다시 시도하세요." 
      });
    }

    // CORS 허용 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "서버 통신 실패" });
  }
}