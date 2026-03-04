import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import useSWR from 'swr';
import Head from 'next/head';
import Header from '../../../components/Header'; // Importar el Header

// Usar la URL del backend directamente
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FoodType { id: number; name: string; }
interface Category { id: number; name: string; price: number; durationDays: number; }
interface User { id: string; email: string; fullName: string; }
interface City { id: number; name: string; }

export default function AdminCrearAnuncioPage({ token }: { token: string }) {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceOffer, setPriceOffer] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [foodTypeId, setFoodTypeId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [cityId, setCityId] = useState<string>('');
  const [clientId, setClientId] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [paid, setPaid] = useState<boolean>(true);
  
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetcher para SWR que incluye el token de autorización
  const fetcher = (url: string) => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Llamar directamente al backend
        const [foodTypesRes, categoriesRes, citiesRes] = await Promise.all([
          axios.get(`${backendApiUrl}/food-types`),
          axios.get(`${backendApiUrl}/categories`),
          axios.get(`${backendApiUrl}/cities`),
        ]);
        setFoodTypes(foodTypesRes.data);
        setCategories(categoriesRes.data);
        setCities(citiesRes.data);
        if (citiesRes.data.length > 0) setCityId(String(citiesRes.data[0].id));
      } catch (err) {
        setError('No se pudieron cargar los datos necesarios.');
      }
    };
    fetchData();
  }, []);

  const { data: usersFound } = useSWR(
    userSearch.length > 2 ? `${backendApiUrl}/admin/users/search?email=${userSearch}` : null,
    fetcher
  );

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!image || !foodTypeId || !categoryId || !cityId || !clientId) {
      setError('Por favor, completa todos los campos, incluyendo la asignación de un cliente y la ciudad.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('priceOffer', priceOffer);
      formData.append('image', image);
      formData.append('foodTypeId', foodTypeId);
      formData.append('categoryId', categoryId);
      formData.append('cityId', cityId);
      formData.append('clientId', clientId);
      formData.append('isActive', String(isActive));
      formData.append('paid', String(paid));

      // Llamar directamente al backend
      await axios.post(`${backendApiUrl}/ads`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });

      alert('¡Anuncio creado con éxito por el administrador!');
      router.push('/admin/anuncios');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ocurrió un error al crear el anuncio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Crear Anuncio (Admin)</title>
      </Head>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Crear Anuncio (Admin)</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700">Asignar a Cliente</label>
              <input
                type="text"
                id="userSearch"
                placeholder="Buscar por email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              {usersFound && usersFound.length > 0 && (
                <select value={clientId} onChange={(e) => setClientId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="">Selecciona un usuario</option>
                  {usersFound.map((user: User) => (
                    <option key={user.id} value={user.id}>{user.fullName} ({user.email})</option>
                  ))}
                </select>
              )}
              {usersFound && usersFound.length === 0 && userSearch.length > 2 && <p className="text-sm text-gray-500 mt-1">No se encontraron usuarios.</p>}
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título</label>
              <input type="text" id="title" placeholder="Título del Anuncio" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="description" placeholder="Descripción detallada" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio Regular ($)</label>
                <input type="number" id="price" placeholder="Ej: 10.00" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="priceOffer" className="block text-sm font-medium text-gray-700">Precio de Oferta ($)</label>
                <input type="number" id="priceOffer" placeholder="Ej: 7.50" value={priceOffer} onChange={(e) => setPriceOffer(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            
            <div>
              <label htmlFor="foodType" className="block text-sm font-medium text-gray-700">Tipo de Comida</label>
              <select id="foodType" value={foodTypeId} onChange={(e) => setFoodTypeId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Selecciona un tipo</option>
                {foodTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría</label>
              <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad</label>
              <select id="city" value={cityId} onChange={(e) => setCityId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Selecciona una ciudad</option>
                {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Imagen del Anuncio</label>
              <input type="file" id="image" accept="image/*" onChange={handleImageChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>

            {/* Controles de Admin */}
            <div className="flex items-center space-x-4">
              <label htmlFor="isActive" className="flex items-center">
                <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                <span className="ml-2 text-sm text-gray-900">Activo</span>
              </label>
              <label htmlFor="paid" className="flex items-center">
                <input type="checkbox" id="paid" checked={paid} onChange={(e) => setPaid(e.target.checked)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"/>
                <span className="ml-2 text-sm text-gray-900">Pagado</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
              {loading ? 'Creando...' : 'Crear Anuncio'}
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
  if (!session || session.user.role !== 'admin') {
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
