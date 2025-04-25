// client/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  // you can set default headers here if you like
});

export default api;
