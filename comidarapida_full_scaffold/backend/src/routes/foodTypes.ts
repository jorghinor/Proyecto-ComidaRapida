import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// Endpoint para obtener todos los tipos de comida con el conteo de anuncios activos
router.get('/', async (req, res) => {
  try {
    const foodTypes = await prisma.foodType.findMany({
      include: {
        _count: {
          select: {
            Ads: {
              where: { isActive: true } // Contar solo anuncios activos
            }
          }
        }
      }
    });

    // Formatear la respuesta para incluir el conteo
    const formattedFoodTypes = foodTypes.map(ft => ({
      id: ft.id,
      slug: ft.slug,
      name: ft.name,
      adCount: ft._count.Ads,
    }));

    res.status(200).json(formattedFoodTypes);
  } catch (error: any) {
    console.error('Error al obtener tipos de comida:', error);
    res.status(500).json({ error: 'Error al obtener tipos de comida.', details: error.message });
  }
});

export default router;
