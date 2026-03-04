import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

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
    const headers: any = {};
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const response = await axios.get(`${apiUrl}/admin/users/search`, {
      params: req.query,
      headers,
    });

    res.status(response.status).json(response.data);
  } catch (e: any) {
    console.error('Proxy API error:', e.response?.data || e.message);
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
}
