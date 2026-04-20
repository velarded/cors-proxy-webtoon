import { get, set } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, refresh } = req.query;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing url parameter' 
    });
  }

  // Validate it's a Webtoon artist/profile URL
  if (!url.includes('/p/community/en/u/')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid artist profile URL. Must be from /p/community/en/u/' 
    });
  }

  // Create cache key from URL
  const cacheKey = `artist:${Buffer.from(url).toString('base64')}`;
  
  // Check cache if refresh isn't requested
  if (refresh !== 'true') {
    try {
      const cached = await get(cacheKey);
      if (cached) {
        return res.status(200).json({
          ...cached,
          cached: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
        });
      }
    } catch (err) {
      console.log('Cache read error:', err);
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract series count and followers count
    let series = null;
    let followers = null;
    
    const seriesPattern = /<span class="CreatorBriefMetric_title__b8ViP">Series<\/span><span class="CreatorBriefMetric_count__mxAPX">(\d+)<\/span>/i;
    const seriesMatch = html.match(seriesPattern);
    if (seriesMatch) {
      series = parseInt(seriesMatch[1]);
    }
    
    const followersPattern = /<span class="CreatorBriefMetric_title__b8ViP">Followers<\/span><span class="CreatorBriefMetric_count__mxAPX">(\d+)<\/span>/i;
    const followersMatch = html.match(followersPattern);
    if (followersMatch) {
      followers = parseInt(followersMatch[1]);
    }
    
    if (series === null && followers === null) {
      return res.status(404).json({
        success: false,
        error: 'Could not find series or followers count on the artist page'
      });
    }
    
    const artistName = url.split('/u/')[1] || 'unknown';
    
    const result = {
      success: true,
      url: url,
      artist: artistName,
      series: series,
      followers: followers,
      scrapedAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    // Store in cache for 1 hour
    try {
      await set(cacheKey, result, { ex: 3600 });
    } catch (err) {
      console.log('Cache write error:', err);
    }
    
    return res.status(200).json({
      ...result,
      cached: false
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}