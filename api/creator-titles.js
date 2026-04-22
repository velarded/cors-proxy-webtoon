export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=1800');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { creatorId } = req.query;
  
  if (!creatorId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing creatorId parameter' 
    });
  }

  try {
    // Call the Webtoon API
    const apiUrl = `https://www.webtoons.com/p/community/api/v1/creator/${creatorId}/titles`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml, application/json, text/plain, */*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // Parse XML to extract totalCount
    let totalCount = null;
    
    // Method 1: Regex extraction (simplest)
    const totalCountMatch = text.match(/<totalCount>(\d+)<\/totalCount>/i);
    if (totalCountMatch) {
      totalCount = parseInt(totalCountMatch[1]);
    }
    
    if (totalCount === null) {
      return res.status(404).json({
        success: false,
        error: 'Could not find totalCount in API response',
        rawResponsePreview: text.substring(0, 500) // Helpful for debugging
      });
    }
    
    return res.status(200).json({
      success: true,
      creatorId: creatorId,
      totalTitles: totalCount,
      apiUrl: apiUrl,
      scrapedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}