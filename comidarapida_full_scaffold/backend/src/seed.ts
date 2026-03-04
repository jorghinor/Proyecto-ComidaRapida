import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();

async function main(){
  // Crear o actualizar categorías
  const categoriesData = [
    { code: 'A', name: 'Categoria A', visibilityRank: 100, price: 100.0, durationDays: 7 },
    { code: 'B', name: 'Categoria B', visibilityRank: 80, price: 60.0, durationDays: 7 },
    { code: 'C', name: 'Categoria C', visibilityRank: 50, price: 30.0, durationDays: 7 },
    { code: 'D', name: 'Categoria D', visibilityRank: 20, price: 10.0, durationDays: 7 },
    { code: 'E', name: 'Categoria E', visibilityRank: 5, price: 0.0, durationDays: 7 },
  ];

  for (const cat of categoriesData) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat,
    });
  }

  const city = await prisma.city.upsert({
    where: { name: 'La Paz' },
    update: {},
    create: { name: 'La Paz', lat: -16.5, lng: -68.15 }
  });

  // Crear o actualizar varios tipos de comida
  const foodTypesData = [
    { slug: 'saltenas', name: 'Salteñas' },
    { slug: 'empanadas', name: 'Empanadas' },
    { slug: 'sandwich', name: 'Sándwich' },
    { slug: 'piqueos', name: 'Piqueos' },
    { slug: 'hamburguesas', name: 'Hamburguesas' },
    { slug: 'pizzas', name: 'Pizzas' },
    { slug: 'tacos', name: 'Tacos' },
  ];

  const createdFoodTypes = [];
  for (const ft of foodTypesData) {
    const foodType = await prisma.foodType.upsert({
      where: { slug: ft.slug },
      update: ft,
      create: ft
    });
    createdFoodTypes.push(foodType);
  }

  // Hashear la contraseña para los usuarios
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Crear o actualizar un usuario de demostración (cliente)
  const user = await prisma.user.upsert({
    where: { email: 'demo@comidarapida.test' },
    update: { password: hashedPassword, fullName: 'Demo', role: 'client' },
    create: { email: 'demo@comidarapida.test', fullName: 'Demo', role: 'client', password: hashedPassword }
  });

  // Crear o actualizar un usuario administrador
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@comidarapida.test' },
    update: { password: hashedPassword, fullName: 'Admin', role: 'admin' },
    create: { email: 'admin@comidarapida.test', fullName: 'Admin', role: 'admin', password: hashedPassword }
  });

  // --- Obtener IDs dinámicamente para el anuncio de demostración ---
  const saltenasFoodType = createdFoodTypes.find(ft => ft.slug === 'saltenas');
  const categoryA = await prisma.category.findUnique({ where: { code: 'A' } });

  if (!saltenasFoodType) {
    console.error('FoodType "saltenas" not found, cannot create demo ad.');
    return;
  }
  if (!categoryA) {
    console.error('Category "A" not found, cannot create demo ad.');
    return;
  }
  // --- Fin de obtención de IDs dinámicamente ---

  // Crear un anuncio de demostración
  try {
    await prisma.ad.upsert({ // Usar upsert para evitar errores si el ad ya existe y tiene un ID fijo
      where: { id: 'demo-ad-saltena' }, // ID fijo para el upsert
      update: {
        clientId: user.id,
        title: 'Salteña de pollo - Oferta',
        description: 'Salteña grande con descuento especial',
        foodTypeId: saltenasFoodType.id,
        cityId: city.id,
        categoryId: categoryA.id, // Usar el ID dinámico
        price: 5.0,
        priceOffer: 3.0,
        discountPercent: (1 - 3.0/5.0) * 100,
        imageUrl: '/demo/saltena.jpg',
        logoUrl: '/demo/logo.png',
        hashtags: ['saltena', 'oferta'],
        whatsapp: '+59170000000',
        isActive: true,
        paid: true
      },
      create: {
        id: 'demo-ad-saltena', // ID fijo para la creación
        clientId: user.id,
        title: 'Salteña de pollo - Oferta',
        description: 'Salteña grande con descuento especial',
        foodTypeId: saltenasFoodType.id,
        cityId: city.id,
        categoryId: categoryA.id, // Usar el ID dinámico
        price: 5.0,
        priceOffer: 3.0,
        discountPercent: (1 - 3.0/5.0) * 100,
        imageUrl: '/demo/saltena.jpg',
        logoUrl: '/demo/logo.png',
        hashtags: ['saltena', 'oferta'],
        whatsapp: '+59170000000',
        isActive: true,
        paid: true
      }
    });
  } catch (e: any) {
    console.error('Error creating/updating demo ad:', e);
  }

  console.log('Seed complete. Admin user created: admin@comidarapida.test');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => process.exit(0));
