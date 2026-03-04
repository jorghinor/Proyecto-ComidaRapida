import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Endpoint para obtener todas las categorías
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        visibilityRank: 'desc', // Ordenar por visibilidad
      }
    });
    res.status(200).json(categories);
  } catch (error: any) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías.', details: error.message });
  }
});

export default router;
