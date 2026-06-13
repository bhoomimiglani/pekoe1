import axios from 'axios';

// Dynamically resolve the server host so any device on the network works.
// In production, SERVER_URL would be set via env. In dev, we point to port 3001
// on whatever host served the React app (handles both localhost and LAN IP).
const SERVER_HOST = process.env.REACT_APP_SERVER_URL || 
  (window.location.hostname === 'localhost' 
    ? 'http://localhost:3001' 
    : `http://${window.location.hostname}:3001`);

const api = axios.create({
  baseURL: SERVER_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { SERVER_HOST };
export default api;