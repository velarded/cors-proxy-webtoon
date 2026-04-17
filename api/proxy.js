export default async function handler(req, res) {
  // Enable CORS for your Framer domain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get the target URL from query parameter
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    console.log(`Fetching HTML from: ${targetUrl}`);
    
    // Fetch the HTML content
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Get the HTML as text (not JSON)
    const html = await response.text();
    
    console.log(`Successfully fetched HTML, length: ${html.length} characters`);
    
    // Return the HTML as a string
    res.status(200).json({ 
      success: true, 
      html: html,
      url: targetUrl
    });
    
  } catch (error) {
    console.error('Proxy error details:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch HTML',
      details: error.message
    });
  }
}