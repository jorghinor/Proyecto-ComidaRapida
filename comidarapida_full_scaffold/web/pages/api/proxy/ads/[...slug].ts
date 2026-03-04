import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const apiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

// Función para parsear el body manualmente cuando bodyParser está desactivado
const parseBody = (req: NextApiRequest): Promise<any> => {
  // Para las reseñas, el body es JSON.
  if (req.headers['content-type'] === 'application/json') {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => { data += chunk; });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
      req.on('error', err => reject(err));
    });
  }
  // Para otros casos (como FormData en PUT), devolvemos el stream de la request.
  return Promise.resolve(req);
};

export const config = {
  api: {
    bodyParser: false, // Desactivado para manejar streams y JSON manualmente
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!apiUrl) {
    return res.status(500).json({ error: "API URL not configured" });
  }

  try {
    const { slug } = req.query;
    const path = Array.isArray(slug) ? slug.join('/') : '';
    const targetUrl = `${apiUrl}/ads/${path}`;

    const headers: any = {
      ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
    };

    const method = req.method?.toUpperCase();

    switch (method) {
      case 'GET': {
        const response = await axios.get(targetUrl, { headers });
        return res.status(200).json(response.data);
      }
      
      case 'PUT': { // Para actualizar el anuncio (FormData)
        headers['Content-Type'] = req.headers['content-type'];
        const backendResponse = await axios.put(targetUrl, req, {
          headers,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        });
        return res.status(backendResponse.status).json(backendResponse.data);
      }

      case 'POST': { // Para reseñas (JSON) y likes
        const body = await parseBody(req);
        // Si el body es JSON (para reseñas), se establece el content-type.
        // Si es un stream (para likes sin body), no se establece y axios lo maneja.
        if (typeof body === 'object' && !('pipe' in body)) {
            headers['Content-Type'] = 'application/json';
        }
        const backendResponse = await axios.post(targetUrl, body, { headers });
        return res.status(backendResponse.status).json(backendResponse.data);
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }

  } catch (e: any) {
    if (axios.isAxiosError(e) && e.response) {
      console.error(`Proxy API error (${e.response.status}):`, e.response.data);
      return res.status(e.response.status).json(e.response.data);
    }
    console.error('Unexpected proxy error:', e.message);
    res.status(500).json({ error: 'Error inesperado en el servidor proxy.', details: e.message });
  }
}
