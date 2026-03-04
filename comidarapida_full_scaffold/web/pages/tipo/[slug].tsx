import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import FloatingMenu from '../../src/components/FloatingMenu';
import AdCard from '../../src/components/AdCard';
import Header from '../../components/Header';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function FoodTypePage() {
  const router = useRouter();
  const { slug } = router.query;

  const [ads, setAds] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Asegurarse de que slug sea siempre un string
  const currentSlug = Array.isArray(slug) ? slug[0] : slug;

  const fetchAds = useCallback(async (currentPage: number) => {
    if (isLoading || !currentSlug) return;
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.append('foodTypeSlug', currentSlug);
    params.append('page', String(currentPage));
    
    try {
      const response = await axios.get(`/api/proxy/ads?${params.toString()}`);
      const { data: newAds, pagination } = response.data;

      setAds(prevAds => currentPage === 1 ? newAds : [...prevAds, ...newAds]);
      setHasMore(pagination.hasNextPage);
    } catch (err) {
      console.error("Error cargando anuncios por tipo:", err);
      setError("No se pudieron cargar los anuncios.");
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [currentSlug, isLoading]);

  // Efecto para recargar anuncios cuando el slug cambia
  useEffect(() => {
    if (currentSlug) {
      setAds([]);
      setPage(1);
      setHasMore(true);
      fetchAds(1);
    }
  }, [currentSlug]); // Dependencia corregida a currentSlug

  const fetchMoreData = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAds(nextPage);
  };

  const pageTitle = currentSlug ? `Ofertas de ${currentSlug.replace(/-/g, ' ')}` : 'Cargando...';

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{pageTitle} - ComidaRapida</title>
        <meta name="description" content={`Ofertas de comida rápida de tipo ${currentSlug}`} />
      </Head>
      <Header />
      <FloatingMenu />

      <main className="flex-grow max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4 capitalize">
          {pageTitle}
        </h2>
        
        {error && <div className="text-red-500">{error}</div>}
        {!ads.length && !isLoading && !error && <p className="mt-4">No hay anuncios disponibles para este tipo de comida.</p>}

        <InfiniteScroll
          dataLength={ads.length}
          next={fetchMoreData}
          hasMore={hasMore}
          loader={<h4 className="text-center my-4">Cargando más ofertas...</h4>}
          endMessage={
            <p className="text-center my-4">
              <b>¡Has llegado al final!</b>
            </p>
          }
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {ads.map((ad: any) => <AdCard key={ad.id} ad={ad} />)}
        </InfiniteScroll>
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
