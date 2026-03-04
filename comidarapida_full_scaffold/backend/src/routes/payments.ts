import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import express from 'express';

const prisma = new PrismaClient();
const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Endpoint para crear una sesión de pago de Stripe
router.post('/create-checkout-session', async (req, res) => {
  const { adId } = req.body;

  if (!adId) {
    return res.status(400).json({ error: 'El ID del anuncio es obligatorio.' });
  }

  try {
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: { Category: true },
    });

    if (!ad || !ad.Category) {
      return res.status(404).json({ error: 'Anuncio o categoría no encontrados.' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Publicación de anuncio: ${ad.title}`,
              images: [ad.imageUrl!],
            },
            unit_amount: Math.round(ad.Category.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pagar/${adId}`,
      metadata: {
        adId: ad.id,
      },
    });

    res.json({ sessionId: session.id });

  } catch (error: any) {
    console.error('Error al crear la sesión de pago de Stripe:', error);
    res.status(500).json({ error: 'Error al crear la sesión de pago.', details: error.message });
  }
});

// Endpoint de Webhook para recibir notificaciones de Stripe
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error('Webhook Error: Faltan la firma de Stripe o el secreto del webhook.');
    return res.status(400).send('Webhook Error: Faltan la firma o el secreto.');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const adId = session.metadata?.adId;

    if (adId) {
      try {
        // Obtener el anuncio y su categoría
        const ad = await prisma.ad.findUnique({
          where: { id: adId },
          include: { Category: true },
        });

        if (ad && ad.Category) {
          const endsAt = new Date();
          endsAt.setDate(endsAt.getDate() + ad.Category.durationDays);

          // 1. Actualizar el anuncio para activarlo
          await prisma.ad.update({
            where: { id: adId },
            data: {
              paid: true,
              isActive: true,
              endsAt: endsAt,
            },
          });

          // 2. Crear un registro del pago en la nueva tabla Payment
          await prisma.payment.create({
            data: {
              adId: ad.id,
              amount: session.amount_total! / 100, // Stripe devuelve el monto en centavos
              currency: session.currency!,
              stripePaymentId: session.id,
              status: session.payment_status,
            },
          });

          console.log(`Anuncio ${adId} activado y pago registrado. Vence el ${endsAt.toISOString()}`);
        }
      } catch (dbError) {
        console.error('Error al actualizar la base de datos después del pago:', dbError);
      }
    }
  }

  res.status(200).json({ received: true });
});


export default router;
