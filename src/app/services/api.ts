const BASE_URL = 'https://plannia-eabkf7dna7g7dqhc.eastus-01.azurewebsites.net/api/v1';

export const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default BASE_URL;