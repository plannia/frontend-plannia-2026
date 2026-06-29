const DEFAULT_BASE_URL =
  'https://plannia-eabkf7dna7g7dqhc.eastus-01.azurewebsites.net/api/v1';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/$/, '');

export const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default BASE_URL;
