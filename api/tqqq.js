// api/tqqq.js
export default async function handler(req, res) {
  const API_KEY = process.env.ALPHA_VANTAGE_KEY;
  const symbol = "TQQQ";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // 무엇이 오든 일단 프론트로 다 보냅니다 (디버깅용)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "Server Fetch Failed" });
  }
}