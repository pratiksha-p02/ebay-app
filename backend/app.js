// Load environment variables and required packages.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Setting eBay API endpoints and marketplace settings based on sandbox or production mode.
const isSandbox = String(process.env.EBAY_ENV || 'sandbox').toLowerCase() !== 'production';
const EBAY_API_BASE = isSandbox ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com';
const EBAY_OAUTH_URL = `${EBAY_API_BASE}/identity/v1/oauth2/token`;
const EBAY_SEARCH_URL = `${EBAY_API_BASE}/buy/browse/v1/item_summary/search`;
const EBAY_MARKETPLACE_ID = process.env.EBAY_MARKETPLACE_ID || 'EBAY_US';

// Storing the cached access token and its expiration time.
let cachedToken = null;
let tokenExpiresAt = 0;


// Fetching a valid eBay access token and reuse it until it expires.
async function getEbayAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const clientId = process.env.EBAY_APP_ID;
  const clientSecret = process.env.EBAY_CERT_ID;

  if (!clientId || !clientSecret) {
    throw new Error('Missing EBAY_APP_ID or EBAY_CERT_ID in environment');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'https://api.ebay.com/oauth/api_scope'
  }).toString();

  const response = await axios.post(EBAY_OAUTH_URL, body, {
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  cachedToken = response.data.access_token;
  const expiresIn = Number(response.data.expires_in || 0);
  tokenExpiresAt = Date.now() + expiresIn * 1000 - 60000;

  return cachedToken;
}

// Convertin eBay API items into a simpler response format for the frontend.
function normalizeEbayItems(items = []) {
  return items.map((item) => ({
    id: item.itemId || Math.random().toString(36).slice(2),
    title: item.title || '',
    price: item.price?.value ? String(item.price.value) : '',
    currency: item.price?.currency || '',
    condition: item.condition || '',
    image: item.image?.imageUrl || item.thumbnailImages?.[0]?.imageUrl || '',
    url: item.itemWebUrl || ''
  }));
}
// Handle search requests, validate filters, call eBay, and return formatted results.
app.get('/search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const page = Math.max(1, Number.parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(String(req.query.limit || '10'), 10) || 10));
  const offset = (page - 1) * limit;

  const minPriceRaw = String(req.query.minPrice || '').trim();
  const maxPriceRaw = String(req.query.maxPrice || '').trim();
  const minPrice = minPriceRaw === '' ? null : Number(minPriceRaw);
  const maxPrice = maxPriceRaw === '' ? null : Number(maxPriceRaw);

  const conditionRaw = String(req.query.condition || '').trim().toLowerCase();
  const allowedConditions = new Set(['', 'new', 'used']);

  if (!q) {
    return res.status(400).json({ ok: false, message: 'Query parameter q is required' });
  }

  if (!allowedConditions.has(conditionRaw)) {
    return res.status(400).json({ ok: false, message: 'Condition must be new or used' });
  }

  const hasMinPrice = minPriceRaw !== '';
  const hasMaxPrice = maxPriceRaw !== '';

  if ((hasMinPrice && Number.isNaN(minPrice)) || (hasMaxPrice && Number.isNaN(maxPrice))) {
    return res.status(400).json({ ok: false, message: 'Price filters must be valid numbers' });
  }

  if (hasMinPrice && hasMaxPrice && minPrice > maxPrice) {
    return res.status(400).json({ ok: false, message: 'Min price must be less than or equal to max price' });
  }

  try {
    const token = await getEbayAccessToken();

    const params = { q, limit, offset };
    const filters = [];

    if (hasMinPrice || hasMaxPrice) {
      if (hasMinPrice && hasMaxPrice) {
        filters.push(`price:[${minPrice}..${maxPrice}]`);
      } else if (hasMinPrice) {
        filters.push(`price:[${minPrice}..]`);
      } else {
        filters.push(`price:[..${maxPrice}]`);
      }
      filters.push('priceCurrency:USD');
    }

    if (conditionRaw === 'new') {
      filters.push('conditions:{NEW}');
    }

    if (conditionRaw === 'used') {
      filters.push('conditions:{USED}');
    }

    if (filters.length) {
      params.filter = filters.join(',');
    }

    const response = await axios.get(EBAY_SEARCH_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': EBAY_MARKETPLACE_ID
      },
      params,
      timeout: 15000
    });

    const results = normalizeEbayItems(response.data.itemSummaries || []);
    const total = Number(response.data.total || 0);

    return res.json({
      ok: true,
      query: q,
      source: isSandbox ? 'ebay-sandbox' : 'ebay',
      page,
      limit,
      total,
      hasNext: offset + limit < total,
      results
    });
  } catch (error) {
    console.error('Search Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;

    if (status === 401) {
      cachedToken = null;
    }

    return res.status(status >= 400 && status < 600 ? status : 500).json({
      ok: false,
      message: 'Search failed',
      error: error.response?.data || error.message
    });
  }
});

function resetTokenCache() {
  cachedToken = null;
  tokenExpiresAt = 0;
}

module.exports = {
  app,
  resetTokenCache,
  normalizeEbayItems,
  getEbayAccessToken
};