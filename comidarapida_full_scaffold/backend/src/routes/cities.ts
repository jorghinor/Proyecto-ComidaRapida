import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Endpoint para obtener todas las ciudades
router.get('/', async (req, res) => {
  try {
    const cities = await prisma.city.findMany({
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
      }
    });
    res.status(200).json(cities);
  } catch (error: any) {
    console.error('Error al obtener ciudades:', error);
    res.status(500).json({ error: 'Error al obtener ciudades.', details: error.message });
  }
});

export default router;
