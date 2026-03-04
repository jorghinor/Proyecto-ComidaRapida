import { Router } from 'express';
import { PrismaClient, Prisma } from '@prisma/client'; // Importar Prisma
import multer from 'multer';
import { decode } from 'next-auth/jwt';
import { computeScoreForAd, cacheScore } from '../score';
import { uploadImage } from '../services/cloudinary';

const prisma = new PrismaClient();
const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Función auxiliar para calcular el porcentaje de descuento
const calculateDiscountPercent = (price: number, priceOffer: number): number | null => {
  if (price > 0 && priceOffer < price) {
    return ((price - priceOffer) / price) * 100;
  }
  return null;
};

// Endpoint para obtener datos para el mapa
router.get('/map-data', async (req, res) => {
  try {
    const adsForMap = await prisma.ad.findMany({
      where: {
        isActive: true,
        paid: true,
        City: {
          lat: { not: null },
          lng: { not: null },
        },
      },
      select: {
        id: true,
        title: true,
        priceOffer: true,
        averageRating: true,
        City: {
          select: {
            lat: true,
            lng: true,
          },
        },
      },
    });
    res.json(adsForMap);
  } catch (error: any) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ error: 'Error fetching map data.', details: error.message });
  }
});

// Endpoint para obtener anuncios recomendados (ej: los 4 más nuevos que están activos y pagados)
router.get('/recommended', async (req, res) => {
  try {
    const recommendedAds = await prisma.ad.findMany({
      where: { isActive: true, paid: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { // Seleccionar campos específicos para ser consistentes
        id: true,
        title: true,
        imageUrl: true,
        priceOffer: true,
        averageRating: true,
        reviewCount: true,
      }
    });
    res.json(recommendedAds);
  } catch (error: any) {
    console.error('Error al obtener anuncios recomendados:', error);
    res.status(500).json({ error: 'Error al obtener anuncios recomendados.', details: error.message });
  }
});

// Endpoint para LISTAR anuncios (público)
router.get('/', async (req, res) => {
  try {
    // --- Parámetros de consulta ---
    const {
      city: cityQuery,
      limit = '20',
      page = '1', // Nuevo parámetro de página
      foodTypeSlug,
      q: searchTerm,
      sortBy,
      minPrice,
      maxPrice,
    } = req.query as { [key: string]: string | undefined };

    const cityId = cityQuery ? parseInt(cityQuery) : undefined;
    const take = Math.min(parseInt(limit), 100);
    const currentPage = parseInt(page);
    const skip = (currentPage - 1) * take; // Calcular cuántos registros saltar

    // --- Construcción de la cláusula WHERE ---
    const whereClause: Prisma.AdWhereInput = {
      isActive: true,
      paid: true,
    };

    if (cityId && cityId !== 0) whereClause.cityId = cityId;
    if (foodTypeSlug) whereClause.FoodType = { slug: foodTypeSlug };
    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    if (minPrice) whereClause.priceOffer = { ...whereClause.priceOffer as Prisma.FloatFilter, gte: parseFloat(minPrice) };
    if (maxPrice) whereClause.priceOffer = { ...whereClause.priceOffer as Prisma.FloatFilter, lte: parseFloat(maxPrice) };

    // --- Construcción de la cláusula ORDER BY ---
    let orderByClause: Prisma.AdOrderByWithRelationInput = { createdAt: 'desc' }; // Orden por defecto

    if (sortBy === 'rating') {
      orderByClause = { averageRating: 'desc' };
    } else if (sortBy === 'price_asc') {
      orderByClause = { priceOffer: 'asc' };
    } else if (sortBy === 'price_desc') {
      orderByClause = { priceOffer: 'desc' };
    }

    // --- Consulta a la base de datos ---
    const [ads, totalAds] = await prisma.$transaction([
      prisma.ad.findMany({
        where: whereClause,
        orderBy: orderByClause,
        skip, // Aplicar paginación
        take, // Aplicar límite
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          priceOffer: true,
          discountPercent: true,
          imageUrl: true,
          logoUrl: true,
          hashtags: true,
          whatsapp: true,
          likes: true,
          isActive: true,
          createdAt: true,
          clientId: true,
          foodTypeId: true,
          categoryId: true,
          averageRating: true,
          reviewCount: true,
          FoodType: { select: { id: true, name: true, slug: true } },
          City: { select: { id: true, name: true } },
          Category: { select: { id: true, name: true, code: true } },
        }
      }),
      prisma.ad.count({ where: whereClause }) // Contar el total de anuncios que coinciden
    ]);

    res.json({
      data: ads,
      pagination: {
        total: totalAds,
        page: currentPage,
        limit: take,
        totalPages: Math.ceil(totalAds / take),
        hasNextPage: currentPage * take < totalAds,
      },
    });
  } catch (error: any) {
    console.error('Error al listar anuncios:', error);
    res.status(500).json({ error: 'Error al listar anuncios.', details: error.message });
  }
});

// ... (el resto del archivo permanece igual)
// Endpoint para OBTENER los anuncios del usuario autenticado
router.get('/my-ads', async (req, res) => {
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
    if (!token || !token.sub) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const userId = token.sub;

    const userAds = await prisma.ad.findMany({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      include: { Category: true }, // Incluir categoría para mostrar detalles
    });

    res.json(userAds);
  } catch (error: any) {
    console.error('Error al obtener los anuncios del usuario:', error);
    res.status(500).json({ error: 'Error al obtener los anuncios del usuario.', details: error.message });
  }
});

// Endpoint para OBTENER un anuncio específico (protegido para el propietario O admin)
router.get('/:id', async (req, res) => {
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
    if (!token || !token.sub) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const userId = token.sub;

    const { id } = req.params;
    const ad = await prisma.ad.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        priceOffer: true,
        imageUrl: true,
        clientId: true,
        foodTypeId: true,
        categoryId: true,
        discountPercent: true,
        likes: true,
        averageRating: true, // Añadido
        reviewCount: true,   // Añadido
      }
    });

    if (!ad) {
      return res.status(404).json({ error: 'Anuncio no encontrado.' });
    }
    if (ad.clientId !== userId && token.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para editar este anuncio.' });
    }

    res.json(ad);
  } catch (error: any) {
    console.error('Error al obtener el anuncio:', error);
    res.status(500).json({ error: 'Error al obtener el anuncio.', details: error.message });
  }
});

// Endpoint para OBTENER un anuncio específico (público)
router.get('/public/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.findUnique({
      where: { id, isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        priceOffer: true,
        discountPercent: true,
        imageUrl: true,
        logoUrl: true,
        hashtags: true,
        whatsapp: true,
        likes: true,
        isActive: true,
        createdAt: true,
        clientId: true,
        foodTypeId: true,
        categoryId: true,
        averageRating: true, // Añadido
        reviewCount: true,   // Añadido
        FoodType: { select: { id: true, name: true, slug: true } },
        City: { select: { id: true, name: true } },
        Category: { select: { id: true, name: true, code: true } },
        Reviews: { // Añadido: Incluir reseñas
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                fullName: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!ad) {
      return res.status(404).json({ error: 'Anuncio no encontrado o no está activo.' });
    }

    res.json(ad);
  } catch (error: any) {
    console.error('Error al obtener el anuncio público:', error);
    res.status(500).json({ error: 'Error al obtener el anuncio público.', details: error.message });
  }
});


// Endpoint para CREAR un nuevo anuncio (protegido)
router.post('/', upload.single('image'), async (req, res) => {
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

    if (!token || !token.sub) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const { title, description, price, priceOffer, foodTypeId, categoryId, clientId, isActive, paid, cityId } = req.body;
    const imageFile = req.file;

    if (!title || !description || !price || !priceOffer || !imageFile || !foodTypeId || !categoryId || !cityId) {
      return res.status(400).json({ error: 'Todos los campos (incluyendo imagen, tipo de comida, categoría y ciudad) son obligatorios.' });
    }

    let adOwnerId = token.sub;
    let adIsActive = false;
    let adIsPaid = false;

    if (token.role === 'admin') {
      if (clientId) {
        adOwnerId = clientId;
      }
      adIsActive = isActive === 'true';
      adIsPaid = paid === 'true';
    }

    const parsedPrice = parseFloat(price);
    const parsedPriceOffer = parseFloat(priceOffer);
    const discountPercent = calculateDiscountPercent(parsedPrice, parsedPriceOffer);

    const imageUrl = await uploadImage(imageFile.buffer);

    const newAd = await prisma.ad.create({
      data: {
        title,
        description,
        price: parsedPrice,
        priceOffer: parsedPriceOffer,
        discountPercent,
        imageUrl,
        clientId: adOwnerId,
        foodTypeId: parseInt(foodTypeId),
        categoryId: parseInt(categoryId),
        cityId: parseInt(cityId),
        isActive: adIsActive,
        paid: adIsPaid,
        // Los campos de rating se inicializan con su valor por defecto (0)
      },
    });
    res.status(201).json(newAd);
  } catch (error: any) {
    console.error('Error al crear el anuncio:', error);
    res.status(500).json({ error: 'Error al crear el anuncio.', details: error.message });
  }
});

// Endpoint para ACTUALIZAR un anuncio existente (protegido para propietario O admin)
router.put('/:id', upload.single('image'), async (req, res) => {
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
    if (!token || !token.sub) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    const userId = token.sub;

    const { id } = req.params;
    const { title, description, price, priceOffer, foodTypeId, categoryId, cityId } = req.body;
    const imageFile = req.file;

    const existingAd = await prisma.ad.findUnique({ where: { id } });
    if (!existingAd) {
      return res.status(404).json({ error: 'Anuncio no encontrado.' });
    }
    if (existingAd.clientId !== userId && token.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permiso para editar este anuncio.' });
    }

    if (!title || !description || !price || !priceOffer || !foodTypeId || !categoryId || !cityId) {
      return res.status(400).json({ error: 'Todos los campos de texto, tipo de comida, categoría y ciudad son obligatorios.' });
    }

    const parsedPrice = parseFloat(price);
    const parsedPriceOffer = parseFloat(priceOffer);
    const discountPercent = calculateDiscountPercent(parsedPrice, parsedPriceOffer);

    let imageUrl = existingAd.imageUrl;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile.buffer);
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: {
        title,
        description,
        price: parsedPrice,
        priceOffer: parsedPriceOffer,
        discountPercent,
        imageUrl,
        foodTypeId: parseInt(foodTypeId),
        categoryId: parseInt(categoryId),
        cityId: parseInt(cityId),
      },
    });
    res.status(200).json(updatedAd);
  } catch (error: any) {
    if (error instanceof Error && error.name === 'JWEInvalid') {
      console.error('JWEInvalid error:', error.message);
      return res.status(401).json({ error: 'Invalid or expired token (JWEInvalid)' });
    }
    console.error('Error al actualizar el anuncio:', error);
    res.status(500).json({ error: 'Error al actualizar el anuncio.', details: error.message });
  }
});

// Endpoint para dar "Me gusta" a un anuncio
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await prisma.ad.update({ where: { id }, data: { likes: { increment: 1 } } });
    res.json(ad);
  } catch (error: any) {
    console.error('Error al dar "Me gusta":', error);
    res.status(500).json({ error: 'Error al dar "Me gusta".', details: error.message });
  }
});


export default router;
