import Head from 'next/head'
import useSWR from 'swr'
import axios from 'axios'
import FloatingMenu from '../src/components/FloatingMenu'
import AdCard from '../src/components/AdCard'
import CategoryCard from '../src/components/CategoryCard'
import FeaturedAdsCarousel from '../src/components/FeaturedAdsCarousel'
import RecommendedAds from '../src/components/RecommendedAds'
import { useState, useEffect, useCallback } from 'react'
import Header from '../components/Header'
import InfiniteScroll from 'react-infinite-scroll-component';

const fetcher = (url: string) => axios.get(url).then(r => r.data);

interface City {
  id: number;
  name: string;
}

interface FoodType {
  id: number;
  slug: string;
  name: string;
  adCount: number;
}

interface Ad {
  id: string;
  // ... otras propiedades
}

export default function Home() {
  // Estados para los filtros que se están aplicando
  const [activeFilters, setActiveFilters] = useState({
    city: '',
    sortBy: '',
    q: '',
    minPrice: '',
    maxPrice: '',
  });

  // Estados para los inputs (lo que el usuario ve y escribe)
  const [searchInput, setSearchInput] = useState('');
  const [minPriceInput, setMinPriceInput] = useState('');
  const [maxPriceInput, setMaxPriceInput] = useState('');

  // Estados para el scroll infinito
  const [ads, setAds] = useState<Ad[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [cities, setCities] = useState<City[]>([]);

  // Cargar ciudades
  useEffect(() => {
    axios.get('/api/proxy/cities').then(res => {
      setCities(res.data);
      if (res.data.length > 0 && !activeFilters.city) {
        setActiveFilters(prev => ({ ...prev, city: String(res.data[0].id) }));
      }
    }).catch(err => console.error('Error al cargar las ciudades:', err));
  }, []);

  const { data: foodTypes } = useSWR<FoodType[]>('/api/proxy/food-types', fetcher);

  const fetchAds = useCallback(async (currentPage: number, newFilters = false) => {
    if (isLoading) return;
    setIsLoading(true);

    const params = new URLSearchParams();
    // Limpiar parámetros vacíos antes de enviar
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });
    params.append('page', String(currentPage));
    
    try {
      const response = await axios.get(`/api/proxy/ads?${params.toString()}`);
      const { data: newAds, pagination } = response.data;

      setAds(prevAds => newFilters ? newAds : [...prevAds, ...newAds]);
      setHasMore(pagination.hasNextPage);
    } catch (error) {
      console.error("Error cargando anuncios:", error);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilters, isLoading]);

  // Efecto para recargar anuncios SOLO cuando los filtros activos cambian
  useEffect(() => {
    setAds([]);
    setPage(1);
    setHasMore(true);
    fetchAds(1, true);
  }, [activeFilters]);

  // Manejador para filtros de texto (se aplican con botón)
  const handleTextFiltersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters(prev => ({
      ...prev,
      q: searchInput,
      minPrice: minPriceInput,
      maxPrice: maxPriceInput,
    }));
  };
  
  // Manejador para filtros de dropdown (se aplican al instante)
  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setActiveFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchMoreData = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAds(nextPage);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Ofertas</title>
        <meta name="description" content="Ofertas de comida rápida" />
      </Head>

      <Header />
      <FeaturedAdsCarousel />
      <FloatingMenu />

      <main className="max-w-6xl mx-auto p-4">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Explora por Categoría</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {foodTypes?.map(ft => (
              <CategoryCard key={ft.id} slug={ft.slug} name={ft.name} adCount={ft.adCount} />
            ))}
          </div>
        </section>

        {/* Panel de Filtros y Búsqueda */}
        <form onSubmit={handleTextFiltersSubmit} className="bg-white p-4 rounded-lg shadow-md mb-8 flex flex-wrap items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-1">Ciudad:</label>
            <select id="city-select" name="city" value={activeFilters.city} onChange={handleDropdownChange} className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">Todas las ciudades</option>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>

          <div className="flex-grow">
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">Ordenar por:</label>
            <select id="sort-by" name="sortBy" value={activeFilters.sortBy} onChange={handleDropdownChange} className="w-full p-2 border border-gray-300 rounded-md">
              <option value="">Relevancia</option>
              <option value="rating">Mejor Calificados</option>
              <option value="price_asc">Precio (menor a mayor)</option>
              <option value="price_desc">Precio (mayor a menor)</option>
            </select>
          </div>

          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio:</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Mín" value={minPriceInput} onChange={(e) => setMinPriceInput(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
              <span>-</span>
              <input type="number" placeholder="Máx" value={maxPriceInput} onChange={(e) => setMaxPriceInput(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
            </div>
          </div>
          
          <div className="flex-grow">
            <label htmlFor="search-term" className="block text-sm font-medium text-gray-700 mb-1">Buscar:</label>
            <input id="search-term" type="text" placeholder="Buscar ofertas..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
          </div>

          <button type="submit" className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Buscar y Filtrar
          </button>
        </form>

        <h2 className="text-2xl font-bold mb-4">Ofertas Recientes</h2>
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

        <div className="mt-12">
          <RecommendedAds />
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
