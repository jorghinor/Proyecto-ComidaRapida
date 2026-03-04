import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Endpoint para obtener anuncios destacados (ej: top 5 por "Me gusta")
router.get('/', async (req, res) => {
  try {
    const featuredAds = await prisma.ad.findMany({
      where: { isActive: true, paid: true },
      orderBy: { likes: 'desc' },
      take: 5,
    });
    res.json(featuredAds);
  } catch (error: any) {
    console.error('Error al obtener anuncios destacados:', error);
    res.status(500).json({ error: 'Error al obtener anuncios destacados.', details: error.message });
  }
});

export default router;
