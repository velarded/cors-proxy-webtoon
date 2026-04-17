import * as cheerio from 'cheerio';

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

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let views = null;
    let subscribers = null;
    
    // Find the grade_area ul
    const gradeArea = $('ul.grade_area');
    
    if (gradeArea.length > 0) {
      // Look for the view count
      const viewElement = gradeArea.find('li:has(.ico_view) .cnt');
      if (viewElement.length > 0) {
        views = parseInt(viewElement.text().replace(/,/g, ''));
      }
      
      // Look for the subscriber count
      const subscriberElement = gradeArea.find('li:has(.ico_subscribe) .cnt');
      if (subscriberElement.length > 0) {
        subscribers = parseInt(subscriberElement.text().replace(/,/g, ''));
      }
    }
    
    if (views === null && subscribers === null) {
      return res.status(404).json({
        success: false,
        error: 'Could not find grade_area with view/subscriber counts'
      });
    }
    
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