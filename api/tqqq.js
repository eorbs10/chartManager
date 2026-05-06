export default async function handler(req, res) {
  const API_KEY = process.env.ALPHA_VANTAGE_KEY; 
  const symbol = "TQQQ";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // Alpha Vantage 특유의 사용량 제한 메시지 체크
    if (data["Note"]) {
        return res.status(429).json({ error: "API 사용량 초과 (분당 5회 제한)" });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "서버 내부 오류" });
  }
}