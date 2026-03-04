import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import Header from '../components/Header'; // Importar el Header

// Usar la URL del backend directamente
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fetcher = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

export default function MisAnunciosPage({ token }: { token: string }) {
  // Llamar directamente al backend
  const { data: ads, error } = useSWR(
    token ? [`${backendApiUrl}/ads/my-ads`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Mis Anuncios</title>
      </Head>
      <Header />

      <main className="flex-grow max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Mis Anuncios</h1>
        
        {error && <div>Error al cargar tus anuncios.</div>}
        {!ads && !error && <div>Cargando...</div>}

        {ads && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ads.map((ad: any) => (
                  <tr key={ad.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{ad.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ad.paid && ad.isActive ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Activo</span>
                      ) : !ad.paid ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pendiente de Pago</span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Inactivo</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.endsAt ? new Date(ad.endsAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!ad.paid && (
                        <Link href={`/pagar/${ad.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                          Pagar
                        </Link>
                      )}
                      <Link href={`/anuncios/editar/${ad.id}`} className="text-indigo-600 hover:text-indigo-900">
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
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
