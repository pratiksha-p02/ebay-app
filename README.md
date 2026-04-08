````markdown
# eBay Product Search Integration

A full-stack application that allows users to search the eBay marketplace, view product listings, and filter by price or condition. This project demonstrates a production-minded integration with the **eBay Browse API**, featuring a secure backend architecture and a responsive Vue 3 frontend.

---

## 🚀 Features

- **Secure API Integration**  
  Handles OAuth 2.0 Client Credentials flow entirely on the backend to keep credentials safe.

- **Token Caching**  
  Access tokens are cached and reused until expiry to optimize performance and respect rate limits.

- **Normalized Data**  
  Converts complex, nested eBay API responses into clean, flat JSON objects for the frontend.

- **Search Debounce**  
  Includes a 500 ms debounce mechanism to prevent unnecessary API calls while the user is typing.

- **Advanced Filtering**  
  Filter results by **price range** and **condition** (New vs Used).

- **Pagination**  
  Full support for browsing through multiple pages of results using Prev and Next controls.

---

## 🛠️ Tech Stack

- **Frontend**: Vue 3 (Script Setup)
- **Backend**: Node.js, Express, Axios
- **API**: eBay Browse API (Search Endpoint)

---

## 📁 Project Structure

```text
.
├── backend/
│   ├── server.js          # Express server with OAuth and search logic
│   ├── .env               # Private credentials (gitignored)
│   └── .env.example       # Template for environment variables
├── frontend/
│   ├── src/
│   │   └── App.vue        # Main search interface and state management
│   └── .env.example       # Frontend environment template
└── README.md              # Documentation
````

---

## ⚙️ Setup and Installation

### 1. Prerequisites

* Node.js installed
* eBay Developer Account with Client ID and Client Secret

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Update your `.env` file:

```env
EBAY_APP_ID=your_client_id
EBAY_CERT_ID=your_client_secret
EBAY_ENV=sandbox
PORT=3000
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

### 4. Run the Backend

```bash
cd ../backend
node server.js
```

---

## 🧠 Trade-offs and Challenges

* **Manual Filter Application**
  Price and condition filters do not trigger automatically. The user must click Search or press Enter. This avoids unnecessary API calls and helps prevent rate limiting.

* **In Memory Caching**
  Token caching is implemented in memory. This works well for a single instance but would need Redis or another shared cache in production.

* **Sandbox Instability**
  The eBay Sandbox frequently returns Error 12000 (internal system error). The backend handles this gracefully to prevent frontend crashes.

* **Backend Normalization**
  Data transformation is handled on the backend to keep the frontend simple and decoupled from eBay’s response structure.

---

## ⏳ What I’d Improve With More Time

* Add unit tests for backend validation and normalization logic
* Use Redis or a database for token caching
* Deploy a live version using Railway, Render, or Vercel
* Improve UI with skeleton loaders and a more responsive grid

---

## 📝 License

Built for the Full Stack Engineering Assignment submission.

```

If you want, I can also:
- add a “Tests” section (since you now have them)
- or tighten this to match exactly what hiring managers look for (small tweaks that boost your score)
```
