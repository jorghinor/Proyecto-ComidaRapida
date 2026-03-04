import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import useSWR from 'swr';
import Header from '../../../../components/Header'; // Importar el Header

const fetcher = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

export default function AdminEditarFoodTypePage({ token }: { token: string }) {
  const router = useRouter();
  const { id } = router.query;

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: foodTypeData, error: foodTypeError } = useSWR(
    id && token ? [`/api/proxy/admin/food-types/${id}`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  useEffect(() => {
    if (foodTypeData) {
      setName(foodTypeData.name);
      setSlug(foodTypeData.slug);
    }
  }, [foodTypeData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.put(`/api/proxy/admin/food-types/${id}`, { name, slug }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Tipo de comida actualizado con éxito.');
      router.push('/admin/food-types');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al actualizar el tipo de comida.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Editar Tipo de Comida</title>
      </Head>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Editar Tipo de Comida</h1> {/* Revertido */}
          
          {foodTypeError && <div>Error al cargar el tipo de comida.</div>}
          {!foodTypeData && id && <div>Cargando tipo de comida...</div>}

          {foodTypeData && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (identificador único, ej: "hamburguesas")</label>
                <input type="text" id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
              </div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
                {loading ? 'Actualizando...' : 'Actualizar Tipo de Comida'}
              </button>
              {error && <p className="text-red-500 text-center">{error}</p>}
            </form>
          )}
        </div>
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
    return { redirect: { destination: '/', permanent: false } };
  }
  return { props: { session, token: session.accessToken } };
};
