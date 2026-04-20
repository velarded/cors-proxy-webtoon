export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Cache for 1 hour (followers don't change rapidly)
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');

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

  // Validate it's a Webtoon artist/profile URL
  if (!url.includes('/p/community/en/u/')) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid artist profile URL. Must be from /p/community/en/u/' 
    });
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
    
    // Method 1: Direct regex for the exact structure you provided
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
    
    // Method 2: More flexible pattern (handles extra whitespace or variations)
    if (!series || !followers) {
      const flexiblePattern = /CreatorBriefMetric_title__b8ViP["']?>\s*Series\s*<\/span>\s*<span class="CreatorBriefMetric_count__mxAPX["']?>\s*(\d+)\s*<\/span>/i;
      const flexibleSeriesMatch = html.match(flexiblePattern);
      if (flexibleSeriesMatch) series = parseInt(flexibleSeriesMatch[1]);
      
      const flexibleFollowersPattern = /CreatorBriefMetric_title__b8ViP["']?>\s*Followers\s*<\/span>\s*<span class="CreatorBriefMetric_count__mxAPX["']?>\s*(\d+)\s*<\/span>/i;
      const flexibleFollowersMatch = html.match(flexibleFollowersPattern);
      if (flexibleFollowersMatch) followers = parseInt(flexibleFollowersMatch[1]);
    }
    
    // Method 3: Extract from the HomeProfile_metric div structure
    if (!series || !followers) {
      const metricDivMatch = html.match(/<div class="HomeProfile_metric__FboSn">(.*?)<\/div>\s*<\/div>/s);
      if (metricDivMatch) {
        const metricContent = metricDivMatch[1];
        
        const seriesInDiv = metricContent.match(/Series<\/span><span[^>]*>(\d+)<\/span>/i);
        if (seriesInDiv) series = parseInt(seriesInDiv[1]);
        
        const followersInDiv = metricContent.match(/Followers<\/span><span[^>]*>(\d+)<\/span>/i);
        if (followersInDiv) followers = parseInt(followersInDiv[1]);
      }
    }
    
    // Check if we found the data
    if (series === null && followers === null) {
      return res.status(404).json({
        success: false,
        error: 'Could not find series or followers count on the artist page',
        hint: 'Make sure the URL is a valid Webtoon artist profile page'
      });
    }
    
    // Extract artist name from URL for additional context
    const artistName = url.split('/u/')[1] || 'unknown';
    
    return res.status(200).json({
      success: true,
      url: url,
      artist: artistName,
      series: series,
      followers: followers,
      scrapedAt: new Date().toISOString(),
      cached: req.headers['x-vercel-cache'] === 'HIT'
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}