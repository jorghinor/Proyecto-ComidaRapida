import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiUrl) {
    return res.status(500).json({ error: "API URL not configured" });
  }

  try {
    const headers: any = {
      // Reenviamos las cabeceras originales, incluyendo la cookie de sesión
      'Cookie': req.headers.cookie,
      'Content-Type': req.headers['content-type'],
    };

    if (req.method === 'GET') {
      const response = await axios.get(`${apiUrl}/ads`, { params: req.query, headers });
      return res.status(200).json(response.data);
    } 
    
    if (req.method === 'POST') {
      const backendResponse = await axios.post(`${apiUrl}/ads`, req, {
        headers,
      });
      return res.status(backendResponse.status).json(backendResponse.data);
    }

    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (e: any) {
    console.error('Proxy API error:', e.response?.data || e.message);
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
}
