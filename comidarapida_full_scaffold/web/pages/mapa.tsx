import Head from 'next/head';
import dynamic from 'next/dynamic';
import Header from '../components/Header';
import useSWR from 'swr';
import axios from 'axios';

// Importar el componente del mapa de forma dinámica y desactivar el renderizado en servidor (SSR)
const MapWithNoSSR = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <p className="flex-grow flex items-center justify-center">Cargando mapa...</p>
});

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function MapPage() {
  // Cargar los datos en la página principal, fuera del componente dinámico
  const { data: ads, error } = useSWR('/api/proxy/ads/map-data', fetcher);

  return (
    <div className="h-screen flex flex-col">
      <Head>
        <title>Mapa de Ofertas - ComidaRapida</title>
      </Head>
      
      <Header />

      <main className="flex-1">
        {error && <p className="text-center text-red-500">No se pudieron cargar los datos del mapa.</p>}
        {!ads && !error && <p className="text-center">Cargando datos...</p>}
        {/* Solo renderizar el mapa cuando los datos estén listos */}
        {ads && <MapWithNoSSR ads={ads} />}
      </main>
    </div>
  );
}
