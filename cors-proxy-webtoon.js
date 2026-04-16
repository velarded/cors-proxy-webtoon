// This is an example of a simple proxy server using Express.js [citation:1][citation:9]
const express = require('express');
const cors = require('cors'); // Enable CORS for your Framer app
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL is required');

    try {
        const response = await fetch(targetUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).send('Proxy error');
    }
});

app.listen(3000);