# Guardian AI – WEB803 Final Project

This is the final project for WEB803: an AI chatbot UI that helps users search and sort event videos from a surveillance VSaaS platform.

## Requirements

1. **Login (OAuth)** – The prompt/search is only available after sign-in. A login page uses a mock OAuth flow (e.g. “Continue with Google”). After login, the app redirects to the chatbot interface.
2. **Filters** – Users can narrow results using filters in the text field area: Group, Device, Date range, and Event type. Applied filters appear as removable chips.
3. **Sorting** – Search results default to **Relevance**. Users can switch to **Time** via the toggle next to “Searching Events”.
4. **Search history (last 30 days)** – The **+** (and clock) button in the top right opens a panel of recent searches. Clicking a history entry restores that query and filters and re-runs the search.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). To build for production:

```bash
npm run build
npm run preview
```

## Tech stack

- **React 18** + **TypeScript**
- **Vite** for dev and build
- No backend: auth and search history are stored in `localStorage`; event data is in-app dummy data.

## Notes

- **Auth** is simulated: “Continue with Google” sets a user (e.g. “Miss Eliza”) and stores it in `localStorage`. Replace with a real OAuth provider when connecting to a backend.
- **Event data** is dummy (e.g. “Active Shooter Reported”, “Line Crossing Alert”) with sample thumbnails. Replace with real VSaaS API calls when available.
