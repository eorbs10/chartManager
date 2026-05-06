// api/tqqq.js
export default async function handler(req, res) {
  // Vercel Settings -> Environment Variables에 등록한 키를 사용합니다.
  const API_KEY = process.env.ALPHA_VANTAGE_KEY; 
  const symbol = "TQQQ";
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=5min&apikey=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    // 브라우저에서 호출 가능하도록 CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "데이터 로드 실패" });
  }
}