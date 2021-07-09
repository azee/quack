import axios from 'axios';

axios.defaults.withCredentials = "include";

export const getApiBaseUrl = (url) =>
  (process.env.NODE_ENV !== "production"
    ? "http://localhost:81/api/"
    : "/api/") + url;


const backend = {
  get: (url, options) => axios.get(getApiBaseUrl(url), options),
  post: (url, options) => axios.post(getApiBaseUrl(url), options),
  'delete': (url, options) => axios.delete(getApiBaseUrl(url), options),
  put: (url, options) => axios.put(getApiBaseUrl(url), options),
}
  
export default backend;