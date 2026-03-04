import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios'; // Importar axios

// No necesitamos PrismaClient ni bcrypt en el frontend
// import { PrismaClient } from '@prisma/client';
// import bcrypt from 'bcryptjs';

const backendApiUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Reenviar la petición de registro al backend
    const response = await axios.post(`${backendApiUrl}/auth/register`, req.body, {
      headers: {
        // Si el registro requiere autenticación de admin, pasar el token
        'Authorization': req.headers.authorization || ''
      }
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error al registrar usuario (proxy):', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Error al registrar usuario' });
  }
}
