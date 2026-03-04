import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import axios from 'axios';
import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const fetcher = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

// Tu Clave Publicable de Stripe
const STRIPE_PUBLIC_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

export default function PagarAnuncioPage({ token }: { token: string }) {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Usamos el endpoint protegido para obtener los detalles del anuncio
  const { data: ad, error: adError } = useSWR(
    id && token ? [`/api/proxy/ads/${id}`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  const handlePayment = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Crear la sesión de pago en nuestro backend
      const response = await axios.post('/api/proxy/payments', { adId: id });
      const { sessionId } = response.data;

      // 2. Redirigir al checkout de Stripe
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe.js no se ha cargado.');
      }
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Error al redirigir a Stripe:', error);
        setError(error.message || 'Ocurrió un error al redirigir a la página de pago.');
      }
    } catch (err: any) {
      console.error('Error al crear la sesión de pago:', err);
      setError(err.response?.data?.error || 'Ocurrió un error al iniciar el pago.');
    } finally {
      setLoading(false);
    }
  };

  if (adError) return <div>Error al cargar el anuncio. Asegúrate de ser el propietario.</div>;
  if (!ad) return <div>Cargando...</div>;

  return (
    <>
      <Head>
        <title>ComidaRapida - Confirmar y Pagar</title>
      </Head>
      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold mb-4">Confirmar y Pagar Anuncio</h1>
          
          <div className="mb-4 border-b pb-4">
            <h2 className="text-xl font-semibold">{ad.title}</h2>
            <p className="text-gray-600">{ad.description}</p>
            {ad.imageUrl && <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto rounded-lg mt-2" />}
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold">Resumen del Pedido</h3>
            <div className="flex justify-between items-center mt-2">
              <p>Categoría del Anuncio:</p>
              <p className="font-medium">{ad.Category?.name || 'N/A'}</p>
            </div>
            <div className="flex justify-between items-center mt-2">
              <p>Precio de la Categoría:</p>
              <p className="font-bold text-xl">${ad.Category?.price || '0.00'}</p>
            </div>
          </div>

          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg disabled:bg-gray-400"
          >
            {loading ? 'Procesando...' : 'Pagar con Tarjeta'}
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  if (!session) {
    return {
      redirect: {
        destination: '/auth/signin',
        permanent: false,
      },
    };
  }
  return {
    props: {
      session,
      token: session.accessToken,
    },
  };
};
