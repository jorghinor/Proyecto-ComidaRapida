import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export const config = {
  api: {
    bodyParser: false, // Dejar que el stream pase para el proxy en PUT
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiUrl) {
    return res.status(500).json({ error: "API URL not configured" });
  }

  const { id } = req.query;
  const targetUrl = `${apiUrl}/admin/users/${id}`;

  try {
    const headers: any = {
      ...(req.headers['content-type'] && { 'Content-Type': req.headers['content-type'] }),
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
    };

    if (req.method === 'GET') {
      const response = await axios.get(targetUrl, { headers });
      return res.status(200).json(response.data);
    }

    if (req.method === 'PUT') {
      const backendResponse = await axios.put(targetUrl, req, {
        headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      return res.status(backendResponse.status).json(backendResponse.data);
    }

    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (e: any) {
    console.error(`Proxy API error for /admin/users/${id}:`, e.response?.data || e.message);
    res.status(e.response?.status || 500).json(e.response?.data || { error: e.message });
  }
}
