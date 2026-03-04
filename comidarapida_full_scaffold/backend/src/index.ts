import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import adsRoutes from './routes/ads';
import foodTypesRoutes from './routes/foodTypes';
import citiesRoutes from './routes/cities';
import categoriesRoutes from './routes/categories';
import paymentsRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import featuredRoutes from './routes/featured';
import reportsRoutes from './routes/reports';
import reviewsRoutes from './routes/reviews'; // Importar la nueva ruta de reseñas

const prisma = new PrismaClient();
const app = express();
app.use(cors());

// --- Rutas ---
app.get('/health', (req, res) => res.json({ok:true}));

// El webhook de Stripe debe recibir el cuerpo raw, así que lo definimos antes del bodyParser global
app.use('/payments/webhook', express.raw({ type: 'application/json' }), paymentsRoutes);

// Ahora, aplicamos el bodyParser para el resto de las rutas
app.use(express.json());

app.use('/ads', adsRoutes);
app.use('/food-types', foodTypesRoutes);
app.use('/cities', citiesRoutes);
app.use('/categories', categoriesRoutes);
app.use('/payments', paymentsRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/featured', featuredRoutes);
app.use('/admin/reports', reportsRoutes);
app.use('/', reviewsRoutes); // Usar la nueva ruta de reseñas

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Backend listening on', port);
});
