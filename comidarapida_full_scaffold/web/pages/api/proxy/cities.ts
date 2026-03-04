import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Determinar la URL de la API.
// Si estamos en el servidor (dentro de Docker), usamos INTERNAL_API_URL.
// Si estamos en el cliente (navegador), usamos NEXT_PUBLIC_API_URL.
const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiUrl) {
    return res.status(500).json({ error: "API URL not configured" });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const response = await axios.get(`${apiUrl}/cities`, { params: req.query });
    res.status(200).json(response.data);
  } catch (e: any) {
    console.error('Proxy API error for /cities:', e.response?.data || e.message);
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
}
