import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the Webtoon URL from query parameter
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing url parameter' 
    });
  }

  try {
    // Fetch the Webtoon page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract data using various methods
    let views = null;
    let subscribers = null;
    
    // Method 1: Look for specific Webtoon data attributes
    $('script').each((i, script) => {
      const content = $(script).html();
      if (content && content.includes('__NEXT_DATA__')) {
        try {
          const match = content.match(/__NEXT_DATA__ = ({.*?});/s);
          if (match) {
            const data = JSON.parse(match[1]);
            // Traverse for view/subscriber data
            views = findNestedValue(data, ['views', 'totalViews', 'viewCount']);
            subscribers = findNestedValue(data, ['subscribers', 'subscriberCount', 'followerCount']);
          }
        } catch(e) {}
      }
    });
    
    // Method 2: Look for text patterns in HTML
    if (!views || !subscribers) {
      const htmlText = $.root().text();
      
      // Pattern for views: "view X,XXX" or "X,XXX views"
      const viewMatch = htmlText.match(/(\d+(?:,\d+)?)\s*views?/i);
      if (viewMatch) {
        views = parseInt(viewMatch[1].replace(/,/g, ''));
      }
      
      // Pattern for subscribers
      const subMatch = htmlText.match(/(\d+(?:,\d+)?)\s*subscribers?/i);
      if (subMatch) {
        subscribers = parseInt(subMatch[1].replace(/,/g, ''));
      }
    }
    
    // Method 3: Look for elements with specific class names
    if (!views || !subscribers) {
      $('[class*="view"], [class*="View"]').each((i, elem) => {
        const text = $(elem).text();
        const match = text.match(/(\d+(?:,\d+)?)/);
        if (match && !views) {
          views = parseInt(match[1].replace(/,/g, ''));
        }
      });
      
      $('[class*="subscriber"], [class*="follower"]').each((i, elem) => {
        const text = $(elem).text();
        const match = text.match(/(\d+(?:,\d+)?)/);
        if (match && !subscribers) {
          subscribers = parseInt(match[1].replace(/,/g, ''));
        }
      });
    }
    
    // Return the results
    return res.status(200).json({
      success: true,
      url: url,
      views: views,
      subscribers: subscribers,
      scrapedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Helper: Find nested value by trying multiple keys
function findNestedValue(obj, keys) {
  if (!obj || typeof obj !== 'object') return null;
  
  // Check current level for any key
  for (const key of keys) {
    if (obj[key] !== undefined && typeof obj[key] === 'number') {
      return obj[key];
    }
  }
  
  // Recursively search children
  for (const value of Object.values(obj)) {
    const result = findNestedValue(value, keys);
    if (result !== null) return result;
  }
  
  return null;
}