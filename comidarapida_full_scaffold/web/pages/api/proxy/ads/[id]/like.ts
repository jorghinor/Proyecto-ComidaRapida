import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiUrl) {
    return res.status(500).json({ error: "API URL not configured" });
  }

  try {
    if (req.method === 'POST') {
      const { id } = req.query;
      // Reenviar la petición POST al backend
      const response = await axios.post(`${apiUrl}/ads/${id}/like`);
      res.status(response.status).json(response.data);
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (e: any) {
    console.error('Proxy API error:', e.response?.data || e.message);
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
}
