import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Header from '../../../components/Header'; // Importar el Header

export default function AdminCrearCategoryPage({ token }: { token: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [visibilityRank, setVisibilityRank] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/proxy/admin/categories', {
        name,
        code,
        price: parseFloat(price),
        durationDays: parseInt(durationDays),
        visibilityRank: parseInt(visibilityRank),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Categoría creada con éxito.');
      router.push('/admin/categories');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al crear la categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Crear Categoría</title>
      </Head>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Crear Nueva Categoría</h1> {/* Revertido */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">Código (ej: "A", "B", "Premium")</label>
              <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio</label>
              <input type="number" id="price" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="durationDays" className="block text-sm font-medium text-gray-700">Duración (días)</label>
              <input type="number" id="durationDays" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="visibilityRank" className="block text-sm font-medium text-gray-700">Ranking de Visibilidad</label>
              <input type="number" id="visibilityRank" value={visibilityRank} onChange={(e) => setVisibilityRank(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
              {loading ? 'Creando...' : 'Crear Categoría'}
            </button>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>
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
