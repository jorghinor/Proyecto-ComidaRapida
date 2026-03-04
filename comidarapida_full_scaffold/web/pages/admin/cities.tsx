import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import useSWR, { useSWRConfig } from 'swr';
import axios from 'axios';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState } from 'react';
import Header from '../../components/Header'; // Importar el Header

const fetcher = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

export default function AdminCitiesPage({ token }: { token: string }) {
  const router = useRouter();
  const { page = '1', q = '' } = router.query;
  const { mutate } = useSWRConfig();
  const swrKey = token ? [`/api/proxy/admin/cities?page=${page}&q=${q}`, token] : null;

  const { data, error } = useSWR(swrKey, ([url, token]) => fetcher(url, token));

  const [searchTerm, setSearchTerm] = useState(q as string);

  const handlePageChange = (newPage: number) => {
    router.push(`/admin/cities?page=${newPage}&q=${searchTerm}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/admin/cities?page=1&q=${searchTerm}`);
  };

  const handleDelete = async (cityId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta ciudad? Los anuncios asociados quedarán sin ciudad.')) {
      try {
        await axios.delete(`/api/proxy/admin/cities/${cityId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        mutate(swrKey);
        alert('Ciudad eliminada con éxito.');
      } catch (err) {
        console.error('Error al eliminar la ciudad:', err);
        alert('Hubo un error al eliminar la ciudad.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Gestionar Ciudades</title>
      </Head>
      <Header />

      <main className="flex-grow max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestionar Ciudades</h1>
          <div className="flex items-center">
            <form onSubmit={handleSearchSubmit} className="flex mr-4">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button type="submit" className="ml-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">
                Buscar
              </button>
            </form>
            <Link href="/admin/cities/crear" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">
              Crear Nueva Ciudad
            </Link>
          </div>
        </div>

        {error && <div>Error al cargar las ciudades.</div>}
        {!data && !error && <div>Cargando...</div>}

        {data && (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Latitud</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Longitud</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.data.map((city: any) => (
                    <tr key={city.id}>
                      <td className="px-6 py-4">{city.name}</td>
                      <td className="px-6 py-4">{city.lat || 'N/A'}</td>
                      <td className="px-6 py-4">{city.lng || 'N/A'}</td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/admin/cities/editar/${city.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Editar
                        </Link>
                        <button onClick={() => handleDelete(city.id)} className="ml-4 text-red-600 hover:text-red-900">
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-700">
                  Página {data.pagination.page} de {data.pagination.totalPages}
                </p>
              </div>
              <div>
                <button
                  onClick={() => handlePageChange(data.pagination.page - 1)}
                  disabled={data.pagination.page <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => handlePageChange(data.pagination.page + 1)}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
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
  if (!session || session.user?.role !== 'admin') {
    return {
      redirect: {
        destination: '/',
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
