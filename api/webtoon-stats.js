// Simple cache object
const cache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing url parameter' 
    });
  }

  // Check cache first
  const cached = cache.get(url);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Cache hit for ${url}`);
    return res.status(200).json({
      ...cached.data,
      cached: true,
      cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000) // seconds ago
    });
  }

  try {
    // Fetch fresh data
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    
    // Extract views and subscribers (using your existing extraction logic)
    let views = null;
    let subscribers = null;
    
    const viewPattern = /<span class="ico_view">view<\/span>\s*<em class="cnt">([\d,]+)<\/em>/i;
    const viewMatch = html.match(viewPattern);
    if (viewMatch) {
      views = parseInt(viewMatch[1].replace(/,/g, ''));
    }
    
    const subscriberPattern = /<span class="ico_subscribe">subscribe<\/span>\s*<em class="cnt">([\d,]+)<\/em>/i;
    const subscriberMatch = html.match(subscriberPattern);
    if (subscriberMatch) {
      subscribers = parseInt(subscriberMatch[1].replace(/,/g, ''));
    }
    
    const result = {
      success: true,
      url: url,
      views: views,
      subscribers: subscribers,
      scrapedAt: new Date().toISOString(),
      cached: false
    };
    
    // Store in cache
    cache.set(url, {
      data: result,
      timestamp: Date.now()
    });
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

    // TODO: get from here https://www.webtoons.com/p/community/en/u/marmae