import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import axios from 'axios';
import FloatingMenu from '../src/components/FloatingMenu';
import AdCard from '../src/components/AdCard';
import Header from '../components/Header';

// Usar la URL del backend directamente
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function SearchResultsPage() {
  const router = useRouter();
  const { q } = router.query;

  // Llamar directamente al backend
  const adsUrl = q ? `${backendApiUrl}/ads?q=${encodeURIComponent(q as string)}` : null;
  const { data: ads, error } = useSWR(adsUrl, fetcher);

  const pageTitle = q ? `Resultados para "${q}"` : 'Buscando...';

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{pageTitle} - ComidaRapida</title>
        <meta name="description" content={`Resultados de búsqueda para: ${q || ''}`} />
      </Head>
      <Header />
      <FloatingMenu />

      <main className="flex-grow max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">
          {q ? `Resultados para: "${q}"` : 'Realiza una búsqueda'}
        </h2>
        
        {error && <div>Error al cargar los resultados.</div>}
        {!ads && q && !error && <div>Cargando...</div>}
        
        {ads && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ads.map((ad: any) => <AdCard key={ad.id} ad={ad} />)}
            </div>
            {ads.length === 0 && <p className="mt-4">No se encontraron anuncios que coincidan con tu búsqueda.</p>}
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
