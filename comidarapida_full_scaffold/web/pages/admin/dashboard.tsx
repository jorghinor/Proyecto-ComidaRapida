import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import Header from '../../components/Header'; // Importar el Header

const fetcher = (url: string, token: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

export default function AdminDashboardPage({ token }: { token: string }) {
  const { data: reports, error } = useSWR(
    token ? [`/api/proxy/admin/reports`, token] : null,
    ([url, token]) => fetcher(url, token)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Panel de Administración</title>
      </Head>
      <Header />

      <main className="flex-grow max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <div className="flex items-center">
            <Link href="/admin/anuncios" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mr-4">
              Gestionar Anuncios
            </Link>
            <Link href="/admin/usuarios" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg mr-4">
              Gestionar Usuarios
            </Link>
            <Link href="/admin/food-types" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg mr-4">
              Gestionar Tipos de Comida
            </Link>
            <Link href="/admin/categories" className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-2 px-4 rounded-lg mr-4">
              Gestionar Categorías
            </Link>
            <Link href="/admin/cities" className="bg-teal-500 hover:bg-teal-600 text-white font-bold py-2 px-4 rounded-lg">
              Gestionar Ciudades
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Tarjeta de Anuncios más Populares */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Anuncios más Populares</h2>
            {reports ? (
              <ul className="mt-4 space-y-2">
                {reports.topLiked.map((ad: any) => (
                  <li key={ad.id} className="flex justify-between items-center">
                    <span>{ad.title}</span>
                    <span className="font-bold">{ad.likes} Me gusta</span>
                  </li>
                ))}
              </ul>
            ) : <p>Cargando...</p>}
          </div>

          {/* Tarjeta de Anuncios por Categoría */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Anuncios por Categoría</h2>
            {reports ? (
              <ul className="mt-4 space-y-2">
                {reports.categoryCounts.map((cat: any) => (
                  <li key={cat.categoryName} className="flex justify-between items-center">
                    <span>{cat.categoryName}</span>
                    <span className="font-bold">{cat.count} anuncios</span>
                  </li>
                  ))}
              </ul>
            ) : <p>Cargando...</p>}
          </div>

          {/* Tarjeta de Reporte de Ingresos */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold">Ingresos Totales</h2>
            {reports ? (
              <div className="mt-4">
                <p className="text-3xl font-bold">
                  ${reports.revenue.total.toFixed(2)}
                </p>
                <p className="text-gray-500">{reports.revenue.currency.toUpperCase()}</p>
              </div>
            ) : <p>Cargando...</p>}
          </div>
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
