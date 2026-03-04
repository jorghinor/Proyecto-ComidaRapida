import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { decode } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const router = Router();

// Middleware de protección para rutas de administrador
const adminAuth = async (req: any, res: any, next: any) => {
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
    if (!token || token.role !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    req.user = token;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

router.use(adminAuth);

// ====================================================================================================
// ENDPOINTS DE REPORTES (DASHBOARD)
// ====================================================================================================

router.get('/reports', async (req, res) => {
  try {
    const topLiked = await prisma.ad.findMany({
      orderBy: { likes: 'desc' },
      take: 10,
      select: { id: true, title: true, likes: true },
    });

    const categoryCounts = await prisma.ad.groupBy({
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

    const validCategoryIds = categoryCounts
      .map(c => c.categoryId)
      .filter(id => id !== null) as number[];

    const categories = await prisma.category.findMany({
      where: {
        id: { in: validCategoryIds },
      },
    });
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    
    const categoryCountsWithName = categoryCounts.map(c => ({
      categoryName: c.categoryId ? categoryMap.get(c.categoryId) || 'Desconocida' : 'Sin Categoría',
      count: c._count.id,
    }));

    const totalRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'paid',
      },
    });

    const revenue = {
      total: totalRevenue._sum.amount || 0,
      currency: 'usd',
    };

    res.json({ topLiked, categoryCounts: categoryCountsWithName, revenue });
  } catch (error: any) {
    console.error('Error al generar reportes:', error);
    res.status(500).json({ error: 'Error al generar reportes.', details: error.message });
  }
});

// ====================================================================================================
// ENDPOINTS DE GESTIÓN DE ANUNCIOS
// ====================================================================================================

router.get('/ads', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '10'));
    const skip = (page - 1) * limit;
    const searchTerm = req.query.q as string | undefined;

    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [ads, totalAds] = await prisma.$transaction([
      prisma.ad.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { email: true } },
        },
      }),
      prisma.ad.count({ where: whereClause }),
    ]);

    res.json({
      data: ads,
      pagination: {
        total: totalAds,
        page,
        limit,
        totalPages: Math.ceil(totalAds / limit),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener los anuncios para admin:', error);
    res.status(500).json({ error: 'Error al obtener los anuncios para admin.', details: error.message });
  }
});

router.delete('/ads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.payment.deleteMany({
      where: { adId: id },
    });

    await prisma.ad.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar el anuncio:', error);
    res.status(500).json({ error: 'Error al eliminar el anuncio.', details: error.message });
  }
});

router.patch('/ads/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'El campo "isActive" debe ser un booleano.' });
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: { isActive },
    });

    res.json(updatedAd);
  } catch (error: any) {
    console.error('Error al cambiar el estado del anuncio:', error);
    res.status(500).json({ error: 'Error al cambiar el estado del anuncio.', details: error.message });
  }
});

router.patch('/ads/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { paid } = req.body;

    if (typeof paid !== 'boolean') {
      return res.status(400).json({ error: 'El campo "paid" debe ser un booleano.' });
    }

    const updatedAd = await prisma.ad.update({
      where: { id },
      data: { paid },
    });

    res.json(updatedAd);
  } catch (error: any) {
    console.error('Error al cambiar el estado de pago:', error);
    res.status(500).json({ error: 'Error al cambiar el estado de pago.', details: error.message });
  }
});

// ====================================================================================================
// ENDPOINTS DE GESTIÓN DE USUARIOS
// ====================================================================================================

// Endpoint para BUSCAR usuarios por email (debe ir ANTES de /users/:id)
router.get('/users/search', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'El parámetro "email" es obligatorio.' });
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      take: 10,
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    res.json(users);
  } catch (error: any) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({ error: 'Error al buscar usuarios.', details: error.message });
  }
});

// Endpoint para obtener TODOS los usuarios (con paginación y filtro)
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '10'));
    const skip = (page - 1) * limit;
    const searchTerm = req.query.q as string | undefined;

    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [users, totalUsers] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    res.json({
      data: users,
      pagination: {
        total: totalUsers,
        page,
        limit,
        totalPages: Math.ceil(totalUsers / limit),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios.', details: error.message });
  }
});

// Endpoint para obtener un usuario específico
router.get('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ error: 'Error al obtener el usuario.', details: error.message });
  }
});

// Endpoint para ACTUALIZAR un usuario
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, fullName, role, password } = req.body;

    const updateData: any = { email, fullName, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true },
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error al actualizar el usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario.', details: error.message });
  }
});

// Endpoint para CAMBIAR EL ROL de un usuario
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'client')) {
      return res.status(400).json({ error: 'El rol especificado no es válido.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error al cambiar el rol del usuario:', error);
    res.status(500).json({ error: 'Error al cambiar el rol del usuario.', details: error.message });
  }
});

// Endpoint para ELIMINAR un usuario
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ad.updateMany({
      where: { clientId: id },
      data: { clientId: null },
    });

    await prisma.user.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario.', details: error.message });
  }
});

// ====================================================================================================
// ENDPOINTS DE GESTIÓN DE TIPOS DE COMIDA
// ====================================================================================================

router.get('/food-types', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '10'));
    const skip = (page - 1) * limit;
    const searchTerm = req.query.q as string | undefined;

    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { slug: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [foodTypes, totalFoodTypes] = await prisma.$transaction([
      prisma.foodType.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.foodType.count({ where: whereClause }),
    ]);

    res.json({
      data: foodTypes,
      pagination: {
        total: totalFoodTypes,
        page,
        limit,
        totalPages: Math.ceil(totalFoodTypes / limit),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener tipos de comida:', error);
    res.status(500).json({ error: 'Error al obtener tipos de comida.', details: error.message });
  }
});

router.get('/food-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const foodType = await prisma.foodType.findUnique({
      where: { id: parseInt(id) },
    });

    if (!foodType) {
      return res.status(404).json({ error: 'Tipo de comida no encontrado.' });
    }
    res.json(foodType);
  } catch (error: any) {
    console.error('Error al obtener tipo de comida:', error);
    res.status(500).json({ error: 'Error al obtener tipo de comida.', details: error.message });
  }
});

router.post('/food-types', async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Nombre y slug son obligatorios.' });
    }

    const newFoodType = await prisma.foodType.create({
      data: { name, slug },
    });
    res.status(201).json(newFoodType);
  } catch (error: any) {
    console.error('Error al crear tipo de comida:', error);
    res.status(500).json({ error: 'Error al crear tipo de comida.', details: error.message });
  }
});

router.put('/food-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: 'Nombre y slug son obligatorios.' });
    }

    const updatedFoodType = await prisma.foodType.update({
      where: { id: parseInt(id) },
      data: { name, slug },
    });
    res.json(updatedFoodType);
  } catch (error: any) {
    console.error('Error al actualizar tipo de comida:', error);
    res.status(500).json({ error: 'Error al actualizar tipo de comida.', details: error.message });
  }
});

router.delete('/food-types/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ad.updateMany({
      where: { foodTypeId: parseInt(id) },
      data: { foodTypeId: null },
    });

    await prisma.foodType.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar tipo de comida:', error);
    res.status(500).json({ error: 'Error al eliminar tipo de comida.', details: error.message });
  }
});

// ====================================================================================================
// ENDPOINTS DE GESTIÓN DE CATEGORÍAS
// ====================================================================================================

router.get('/categories', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '10'));
    const skip = (page - 1) * limit;
    const searchTerm = req.query.q as string | undefined;

    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { code: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [categories, totalCategories] = await prisma.$transaction([
      prisma.category.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.category.count({ where: whereClause }),
    ]);

    res.json({
      data: categories,
      pagination: {
        total: totalCategories,
        page,
        limit,
        totalPages: Math.ceil(totalCategories / limit),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías.', details: error.message });
  }
});

router.get('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return res.status(404).json({ error: 'Categoría no encontrada.' });
    }
    res.json(category);
  } catch (error: any) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ error: 'Error al obtener categoría.', details: error.message });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, code, price, durationDays, visibilityRank } = req.body;

    if (!name || !code || price === undefined || durationDays === undefined || visibilityRank === undefined) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        code,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        visibilityRank: parseInt(visibilityRank),
      },
    });
    res.status(201).json(newCategory);
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    res.status(500).json({ error: 'Error al crear categoría.', details: error.message });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, price, durationDays, visibilityRank } = req.body;

    if (!name || !code || price === undefined || durationDays === undefined || visibilityRank === undefined) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        name,
        code,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        visibilityRank: parseInt(visibilityRank),
      },
    });
    res.json(updatedCategory);
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    res.status(500).json({ error: 'Error al actualizar categoría.', details: error.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ad.updateMany({
      where: { categoryId: parseInt(id) },
      data: { categoryId: null },
    });

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    res.status(500).json({ error: 'Error al eliminar categoría.', details: error.message });
  }
});

// ====================================================================================================
// ENDPOINTS DE GESTIÓN DE CIUDADES
// ====================================================================================================

router.get('/cities', async (req, res) => {
  try {
    const page = parseInt(String(req.query.page || '1'));
    const limit = parseInt(String(req.query.limit || '10'));
    const skip = (page - 1) * limit;
    const searchTerm = req.query.q as string | undefined;

    const whereClause: any = {};
    if (searchTerm) {
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const [cities, totalCities] = await prisma.$transaction([
      prisma.city.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.city.count({ where: whereClause }),
    ]);

    res.json({
      data: cities,
      pagination: {
        total: totalCities,
        page,
        limit,
        totalPages: Math.ceil(totalCities / limit),
      },
    });
  } catch (error: any) {
    console.error('Error al obtener ciudades:', error);
    res.status(500).json({ error: 'Error al obtener ciudades.', details: error.message });
  }
});

router.get('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const city = await prisma.city.findUnique({
      where: { id: parseInt(id) },
    });

    if (!city) {
      return res.status(404).json({ error: 'Ciudad no encontrada.' });
    }
    res.json(city);
  } catch (error: any) {
    console.error('Error al obtener ciudad:', error);
    res.status(500).json({ error: 'Error al obtener ciudad.', details: error.message });
  }
});

router.post('/cities', async (req, res) => {
  try {
    const { name, lat, lng } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre de la ciudad es obligatorio.' });
    }

    const newCity = await prisma.city.create({
      data: { name, lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null },
    });
    res.status(201).json(newCity);
  } catch (error: any) {
    console.error('Error al crear ciudad:', error);
    res.status(500).json({ error: 'Error al crear ciudad.', details: error.message });
  }
});

router.put('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, lat, lng } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre de la ciudad es obligatorio.' });
    }

    const updatedCity = await prisma.city.update({
      where: { id: parseInt(id) },
      data: { name, lat: lat ? parseFloat(lat) : null, lng: lng ? parseFloat(lng) : null },
    });
    res.json(updatedCity);
  } catch (error: any) {
    console.error('Error al actualizar ciudad:', error);
    res.status(500).json({ error: 'Error al actualizar ciudad.', details: error.message });
  }
});

router.delete('/cities/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.ad.updateMany({
      where: { cityId: parseInt(id) },
      data: { cityId: null },
    });

    await prisma.city.delete({
      where: { id: parseInt(id) },
    });

    res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar ciudad:', error);
    res.status(500).json({ error: 'Error al eliminar ciudad.', details: error.message });
  }
});

export default router;
