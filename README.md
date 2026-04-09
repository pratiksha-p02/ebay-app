# eBay Product Search Integration

A full stack application that allows users to search the eBay marketplace, view product listings, and filter by price or condition. This project demonstrates a production minded integration with the eBay Browse API, with a secure backend and a Vue 3 frontend.

---

## Features

- Secure API integration  
  Handles OAuth 2.0 Client Credentials flow on the backend so credentials are never exposed to the client.

- Token caching  
  Access tokens are cached and reused until expiration to reduce unnecessary authentication calls.

- Data normalization  
  Transforms eBay API responses into a clean and consistent format for the frontend.

- Search debounce  
  Adds a 500 ms delay while typing to prevent excessive API requests.

- Filtering  
  Supports filtering by price range and item condition (new or used).

- Pagination  
  Allows users to navigate through results using next and previous controls.

- Backend tests  
  Includes automated tests for server routes, validation, and helper logic.

- Deployment  
  Frontend is deployed on Vercel and backend is deployed on Render.

---

## Tech Stack

Frontend: Vue 3 (script setup)  
Backend: Node.js, Express, Axios  
API: eBay Browse API  

---

## Project Structure


.
├── backend/
│ ├── app.js
│ ├── server.js
│ ├── package.json
│ ├── .env.example
│ └── tests/
│ └── search.test.js
├── frontend/
│ ├── package.json
│ ├── .env.example
│ └── src/
│ └── App.vue
└── README.md


---

## Setup and Installation

### Prerequisites

- Node.js installed  
- eBay Developer account with client ID and client secret  

### Backend setup


cd backend
npm install
cp .env.example .env


Update `.env`:


EBAY_APP_ID=your_client_id
EBAY_CERT_ID=your_client_secret
EBAY_ENV=sandbox
PORT=3000


### Frontend setup


cd frontend
npm install
npm run dev


### Run backend


cd backend
node server.js


---

## Tests

The backend includes automated tests for search routes, input validation, and response formatting to ensure the API behaves correctly.

---

## Trade offs and challenges

Manual filter triggering  
Filters are applied only when the user submits the search instead of on every change. This reduces unnecessary API calls and avoids hitting rate limits.

In memory token caching  
Token caching is stored in memory, which works for a single instance but would need a shared cache like Redis in a production environment.

Sandbox instability  
The eBay sandbox can return intermittent errors. The backend handles these cases to prevent the frontend from breaking.

Backend normalization  
Data transformation is handled on the backend so the frontend stays simple and independent from the eBay API structure.

---

## Improvements

- Add more comprehensive test coverage  
- Use a shared cache like Redis for token management  
- Improve UI with loading states and better responsiveness  
- Add more advanced filters and sorting options  

---

## Deployment

Frontend deployed on Vercel  
Backend deployed on Render  

---

## License

Built for a full stack engineering assignment. :)

