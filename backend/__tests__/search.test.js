const request = require('supertest');
const axios = require('axios');
const { app, resetTokenCache } = require('../app');

jest.mock('axios');

describe('GET /search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetTokenCache();

    process.env.EBAY_APP_ID = 'test_app_id';
    process.env.EBAY_CERT_ID = 'test_cert_id';
    process.env.EBAY_ENV = 'sandbox';
    process.env.EBAY_MARKETPLACE_ID = 'EBAY_US';
  });

  test('returns 400 when q is missing', async () => {
    const response = await request(app).get('/search');

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.message).toMatch(/q is required/i);
  });

  test('returns 400 when condition is invalid', async () => {
    const response = await request(app)
      .get('/search')
      .query({ q: 'iphone', condition: 'broken' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.message).toMatch(/condition must be new or used/i);
  });

  test('returns 400 when price is invalid', async () => {
    const response = await request(app)
      .get('/search')
      .query({ q: 'iphone', minPrice: 'abc' });

    expect(response.status).toBe(400);
    expect(response.body.ok).toBe(false);
    expect(response.body.message).toMatch(/price filters must be valid numbers/i);
  });

  test('returns normalized search results', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        access_token: 'token123',
        expires_in: 7200
      }
    });

    axios.get.mockResolvedValueOnce({
      data: {
        total: 1,
        itemSummaries: [
          {
            itemId: '1',
            title: 'Apple iPhone 14',
            price: { value: '499.99', currency: 'USD' },
            condition: 'Used',
            image: { imageUrl: 'https://example.com/image.jpg' },
            itemWebUrl: 'https://example.com/listing'
          }
        ]
      }
    });

    const response = await request(app)
      .get('/search')
      .query({ q: 'iphone', condition: 'used' });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.query).toBe('iphone');
    expect(response.body.total).toBe(1);
    expect(response.body.results).toHaveLength(1);
    expect(response.body.results[0]).toEqual({
      id: '1',
      title: 'Apple iPhone 14',
      price: '499.99',
      currency: 'USD',
      condition: 'Used',
      image: 'https://example.com/image.jpg',
      url: 'https://example.com/listing'
    });
  });

  test('reuses cached token on a second request', async () => {
    axios.post.mockResolvedValue({
      data: {
        access_token: 'token123',
        expires_in: 7200
      }
    });

    axios.get.mockResolvedValue({
      data: {
        total: 0,
        itemSummaries: []
      }
    });

    await request(app).get('/search').query({ q: 'phone' });
    await request(app).get('/search').query({ q: 'tablet' });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledTimes(2);
  });
});