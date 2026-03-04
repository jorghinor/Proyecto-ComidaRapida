import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { decode } from 'next-auth/jwt';

const prisma = new PrismaClient();
const router = Router();

// Middleware para asegurar que el usuario esté autenticado
const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
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
    if (token && token.sub) {
      (req as any).userId = token.sub; // Añadir el ID del usuario a la request
      next();
    } else {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Endpoint para CREAR una nueva reseña para un anuncio
router.post('/ads/:adId/reviews', isAuthenticated, async (req: Request, res: Response) => {
  const { adId } = req.params;
  const userId = (req as any).userId;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'La calificación (rating) debe ser un número entre 1 y 5.' });
  }

  try {
    // Usar una transacción para asegurar la consistencia de los datos
    const newReview = await prisma.$transaction(async (tx) => {
      // 1. Crear la nueva reseña
      const review = await tx.review.create({
        data: {
          adId,
          userId,
          rating: Number(rating),
          comment,
        },
      });

      // 2. Calcular la nueva calificación promedio y el conteo de reseñas
      const adReviews = await tx.review.findMany({
        where: { adId },
        select: { rating: true },
      });

      const reviewCount = adReviews.length;
      const totalRating = adReviews.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

      // 3. Actualizar el anuncio con los nuevos valores
      await tx.ad.update({
        where: { id: adId },
        data: {
          reviewCount,
          averageRating,
        },
      });

      return review;
    });

    res.status(201).json(newReview);
  } catch (error: any) {
    if (error.code === 'P2002') { // Código de error de Prisma para violación de restricción única
      return res.status(409).json({ error: 'Ya has dejado una reseña para este anuncio.' });
    }
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Error al crear la reseña.', details: error.message });
  }
});

export default router;
