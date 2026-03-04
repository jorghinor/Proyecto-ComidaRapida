import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiUrl) {
    return res.status(500).json({ error: "API URL not configured" });
  }

  try {
    if (req.method === 'GET') {
      const { id } = req.query;
      // Corregido: La ruta en el backend es /ads/public/:id
      const response = await axios.get(`${apiUrl}/ads/public/${id}`); 
      res.status(200).json(response.data);
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e: any) {
    console.error('Proxy API error:', e.response?.data || e.message);
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
}
