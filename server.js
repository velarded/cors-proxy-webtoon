import express from 'express';
import webtoonStatsHandler from './api/webtoon-stats.js';
import artistStatsHandler from './api/artist-stats.js';
import creatorTitlesHandler from './api/creator-titles.js';

const app = express();
const PORT = process.env.PORT || 4000;

const wrapHandler = (handler) => {
  return async (req, res) => {
    const mockReq = {
      query: req.query,
      method: req.method,
      headers: req.headers,
    };
    
    const mockRes = {
      setHeader: (key, value) => res.setHeader(key, value),
      status: (code) => {
        res.status(code);
        return {
          json: (data) => res.json(data),
          end: () => res.end(),
        };
      },
      json: (data) => res.json(data),
    };
    
    await handler(mockReq, mockRes);
  };
};

app.get('/api/webtoon-stats', wrapHandler(webtoonStatsHandler));
app.get('/api/artist-stats', wrapHandler(artistStatsHandler));
app.get('/api/creator-titles', wrapHandler(creatorTitlesHandler));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    endpoints: [
      'GET /api/webtoon-stats?url=SERIES_URL',
      'GET /api/artist-stats?url=ARTIST_URL',
      'GET /api/creator-titles?creatorId=CREATOR_ID'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`\n🎨 Webtoon API running!`);
  console.log(`📍 http://localhost:${PORT}\n`);
  console.log(`📡 Test endpoints:`);
  console.log(`  http://localhost:${PORT}/api/webtoon-stats?url=https://www.webtoons.com/en/canvas/fragments-of-the-wounds-kizu-no-kakera/list?title_no=972745`);
  console.log(`  http://localhost:${PORT}/api/artist-stats?url=https://www.webtoons.com/p/community/en/u/marmae`);
  console.log(`  http://localhost:${PORT}/api/creator-titles?creatorId=8cmhlp`);
  console.log(`  http://localhost:${PORT}/health\n`);
});