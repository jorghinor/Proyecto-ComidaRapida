import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { decode } from 'next-auth/jwt';

const prisma = new PrismaClient();
const router = Router();

// Middleware de autenticación y autorización de administrador
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Authentication secret not configured' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const tokenString = authHeader.split(' ')[1];

  try {
    const token = await decode({ token: tokenString, secret: Buffer.from(secret) });
    if (token && token.role === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Admins only' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Aplicar el middleware a todas las rutas de este router
router.use(isAdmin);

// Endpoint para obtener los anuncios más populares por "me gusta"
router.get('/popular-ads', async (req, res) => {
  try {
    const popularAds = await prisma.ad.findMany({
      where: {
        likes: {
          gt: 0, // Solo anuncios con al menos un "me gusta"
        },
      },
      orderBy: {
        likes: 'desc',
      },
      take: 10, // Top 10
      select: {
        title: true,
        likes: true,
      },
    });
    res.json(popularAds);
  } catch (error: any) {
    console.error('Error fetching popular ads report:', error);
    res.status(500).json({ error: 'Error fetching popular ads report.', details: error.message });
  }
});

// Endpoint para obtener el conteo de anuncios por categoría
router.get('/ads-by-category', async (req, res) => {
  try {
    const adsByCategory = await prisma.ad.groupBy({
      by: ['categoryId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Obtener los nombres de las categorías para enriquecer los datos
    const categoryIds = adsByCategory.map(item => item.categoryId).filter(id => id !== null) as number[];
    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    const result = adsByCategory.map(item => ({
      categoryName: item.categoryId ? categoryMap.get(item.categoryId) || 'Sin Categoría' : 'Sin Categoría',
      count: item._count.id,
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching ads by category report:', error);
    res.status(500).json({ error: 'Error fetching ads by category report.', details: error.message });
  }
});

export default router;
