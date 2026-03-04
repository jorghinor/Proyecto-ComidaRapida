import Head from 'next/head';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function PagoExitosoPage() {
  const router = useRouter();
  const { session_id } = router.query;

  useEffect(() => {
    if (session_id) {
      // Opcional: podrías usar este session_id para verificar el estado del pago
      // y mostrar más detalles, pero por ahora, solo mostramos un mensaje de éxito.
      console.log('ID de sesión de Stripe:', session_id);
    }
  }, [session_id]);

  return (
    <>
      <Head>
        <title>ComidaRapida - Pago Exitoso</title>
      </Head>
      <main className="max-w-2xl mx-auto p-4 text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 mt-10">
          <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h1 className="text-2xl font-bold mt-4 mb-2">¡Pago Exitoso!</h1>
          <p className="text-gray-600 mb-6">
            Gracias por tu compra. Tu anuncio será activado y publicado en breve.
          </p>
          <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
            Volver a la página principal
          </Link>
        </div>
      </main>
    </>
  );
}
