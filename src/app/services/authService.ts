import BASE_URL, { getHeaders } from './api';

export const signIn = async (email: string, password: string) => {
  const response = await fetch(`${BASE_URL}/authentication/sign-in`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || 'Error al iniciar sesión');

  return data; // { user: {...}, token: "..." }
};

export const signUp = async (name: string, email: string, password: string, position: string, code: string) => {
  const response = await fetch(`${BASE_URL}/authentication/sign-up`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, email, password, position, code }),
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || 'Error al registrarse');

  return data; // { id, name, email, position, role }
};

export const createTeam = async (teamName: string, email: string, leaderName: string, password: string) => {
  const response = await fetch(`${BASE_URL}/teams`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ teamName, email, leaderName, password }),
  });

  const data = await response.json();

  if (!response.ok) throw new Error(data.message || 'Error al crear equipo');

  return data; // { id, name, code, members }
};