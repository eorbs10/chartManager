// api/tqqq.js
export default async function handler(req, res) {
  const API_KEY = process.env.ALPHA_VANTAGE_KEY;
  const symbol = "TQQQ";
  // 60분봉은 무료 키에서 상대적으로 잘 열립니다.
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "API 수급 실패" });
  }
}