const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function recordLogin(accessToken: string) {
  const res = await fetch(`${API_URL}/auth/record-login`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`record-login failed: ${res.status}`);
  }

  return res.json();
}
