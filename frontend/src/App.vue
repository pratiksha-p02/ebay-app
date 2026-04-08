
<template>
  <main class="page">
    <section class="shell">
      <div class="hero">
        <p class="eyebrow">eBay Browse API demo</p>
        <h1>Search products on eBay</h1>
        <p class="subtitle">
          Type a product name, hit search!
        </p>
      </div>

      <form class="search-bar" @submit.prevent="onSubmit">
        <input
          v-model="query"
          @input="onInput"
          type="text"
          placeholder="Search for phones, laptops, shoes, and more"
          autocomplete="off"
        />

        <select v-model="condition" class="price-input">
          <option value="">All conditions</option>
          <option value="new">New</option>
          <option value="used">Used</option>
        </select>

        <input
          v-model="minPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="Min price"
          class="price-input"
        />

        <input
          v-model="maxPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="Max price"
          class="price-input"
        />

        <button type="submit" :disabled="loading">
          {{ loading ? 'Searching...' : 'Search' }}
        </button>
      </form>

      <div class="meta-row">
        <p v-if="searched && !loading && !error" class="meta">
          Total: {{ totalResults }} · {{ results.length }} on this page
        </p>
        <p v-if="source" class="meta">Source: {{ source }}</p>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="loading" class="status">Loading results...</p>
      <p v-if="searched && !loading && !error && results.length === 0" class="status">
        No results found.
      </p>

      <div v-if="results.length" class="grid">
        <a
          v-for="item in results"
          :key="item.id || item.url || item.title"
          class="card"
          :href="item.url"
          target="_blank"
          rel="noreferrer"
        >
          <div class="image-wrap">
            <img v-if="item.image" :src="item.image" :alt="item.title" />
            <div v-else class="image-fallback">No image</div>
          </div>

          <div class="card-body">
            <h2>{{ item.title }}</h2>
            <div class="price-row">
              <p class="price">{{ formatPrice(item.price, item.currency) }}</p>
              <p class="condition">{{ item.condition || 'Unknown condition' }}</p>
            </div>
            <p class="link-text">View listing on eBay</p>
          </div>
        </a>
      </div>

      <div v-if="results.length" style="margin-top: 20px; display: flex; gap: 10px;">
        <button type="button" @click="prevPage" :disabled="page === 1 || loading">Prev</button>
        <button type="button" @click="nextPage" :disabled="!hasNext || loading">Next</button>
      </div>

      <div v-if="!searched && !loading && !error" class="empty-state">
        Search for a product to see eBay listings here.
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, watch } from 'vue';

const query = ref('');
const results = ref([]);
const loading = ref(false);
const error = ref('');
const searched = ref(false);
const source = ref('');
const page = ref(1);
const hasNext = ref(false);
const totalResults = ref(0);
const minPrice = ref('');
const maxPrice = ref('');
const condition = ref('');
let debounceTimeout = null;

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

watch([minPrice, maxPrice, condition], () => {
  page.value = 1;
});

function formatPrice(price, currency) {
  if (price === '' || price === null || price === undefined) return 'Price unavailable';

  const value = Number(price);
  if (Number.isNaN(value)) {
    return currency ? `${price} ${currency}` : String(price);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD'
  }).format(value);
}
function onInput() {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    page.value = 1;
    searchProducts();
  }, 500); // 500ms delay
}

function buildSearchUrl() {
  const params = new URLSearchParams();
  params.set('q', query.value.trim());
  params.set('page', String(page.value));

  if (minPrice.value !== '') params.set('minPrice', minPrice.value);
  if (maxPrice.value !== '') params.set('maxPrice', maxPrice.value);
  if (condition.value !== '') params.set('condition', condition.value);

  return `${backendUrl}/search?${params.toString()}`;
}

async function searchProducts() {
  const trimmed = query.value.trim();

  if (!trimmed) {
    error.value = 'Please enter a search term.';
    results.value = [];
    source.value = '';
    hasNext.value = false;
    totalResults.value = 0;
    searched.value = true;
    return;
  }

  loading.value = true;
  error.value = '';
  searched.value = true;

  try {
    const response = await fetch(buildSearchUrl());
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'Search failed');
    }

    results.value = data.results || [];
    source.value = data.source || '';
    hasNext.value = Boolean(data.hasNext);
    totalResults.value = Number(data.total || 0);
  } catch (err) {
    results.value = [];
    source.value = '';
    hasNext.value = false;
    totalResults.value = 0;
    error.value = err?.message || 'Something went wrong';
  } finally {
    loading.value = false;
  }
}

function onSubmit() {
clearTimeout(debounceTimeout)
  page.value = 1;
  searchProducts();
}

function nextPage() {
  page.value += 1;
  searchProducts();
}

function prevPage() {
  if (page.value > 1) {
    page.value -= 1;
    searchProducts();
  }
}
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f7fb;
  color: #111827;
}

.page {
  min-height: 100vh;
  padding: 40px 16px 60px;
}

.shell {
  max-width: 1180px;
  margin: 0 auto;
}

.hero {
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4f46e5;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.05;
}

.subtitle {
  max-width: 720px;
  margin: 12px 0 0;
  font-size: 1rem;
  line-height: 1.6;
  color: #4b5563;
}

.search-bar {
  display: flex;
  gap: 12px;
  margin: 28px 0 12px;
}

.search-bar input,
.search-bar select {
  flex: 1;
  min-width: 0;
  padding: 16px 18px;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  background: white;
  outline: none;
}

.search-bar input:focus,
.search-bar select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.search-bar button {
  padding: 16px 22px;
  border: none;
  border-radius: 16px;
  background: #111827;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.search-bar button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.meta-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta,
.status,
.error {
  margin: 0 0 14px;
  font-size: 0.95rem;
}

.meta {
  color: #6b7280;
}

.status {
  color: #374151;
}

.error {
  color: #b91c1c;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.card {
  display: block;
  text-decoration: none;
  color: inherit;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 10px 24px rgba(17, 24, 39, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(17, 24, 39, 0.1);
}

.image-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #f3f4f6;
}

.card img,
.image-fallback {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-fallback {
  display: grid;
  place-items: center;
  color: #6b7280;
  font-weight: 600;
}

.card-body {
  padding: 16px;
}

.card h2 {
  margin: 0 0 12px;
  font-size: 1rem;
  line-height: 1.4;
}

.price-row {
  display: grid;
  gap: 6px;
}

.price {
  margin: 0;
  font-weight: 800;
  font-size: 1.05rem;
}

.condition {
  margin: 0;
  color: #6b7280;
  font-size: 0.92rem;
}

.price-input {
  width: 140px;
  padding: 16px 18px;
  font-size: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  background: white;
  outline: none;
}

.price-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.link-text {
  margin: 14px 0 0;
  font-size: 0.92rem;
  color: #4f46e5;
  font-weight: 600;
}

.empty-state {
  margin-top: 24px;
  padding: 22px;
  border: 1px dashed #cbd5e1;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.7);
  color: #475569;
}

@media (max-width: 640px) {
  .search-bar {
    flex-direction: column;
  }

  .search-bar button,
  .price-input,
  .search-bar select {
    width: 100%;
  }
}
</style>