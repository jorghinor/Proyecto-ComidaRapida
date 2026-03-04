import { getSession } from 'next-auth/react';
import { GetServerSideProps } from 'next';
import { useState, ChangeEvent, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Head from 'next/head';
import Header from '../../components/Header'; // Importar el Header

// Usar la URL del backend directamente
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface FoodType {
  id: number;
  name: string;
}

interface Category {
  id: number;
  name: string;
  price: number;
  durationDays: number;
}

interface City {
  id: number;
  name: string;
}

export default function CrearAnuncioPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [priceOffer, setPriceOffer] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [foodTypeId, setFoodTypeId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [cityId, setCityId] = useState<string>('');
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        if (foodTypesRes.data.length > 0) setFoodTypeId(String(foodTypesRes.data[0].id));

        setCategories(categoriesRes.data);
        if (categoriesRes.data.length > 0) setCategoryId(String(categoriesRes.data[0].id));

        setCities(citiesRes.data);
        if (citiesRes.data.length > 0) setCityId(String(citiesRes.data[0].id));
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('No se pudieron cargar los datos necesarios.');
      }
    };
    fetchData();
  }, []);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setImage(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!image || !foodTypeId || !categoryId || !cityId) {
      setError('Por favor, completa todos los campos.');
      setLoading(false);
      return;
    }

    try {
      const session = await getSession();
      if (!session || !session.accessToken) throw new Error('No has iniciado sesión o el token no está disponible.');

      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('priceOffer', priceOffer);
      formData.append('image', image);
      formData.append('foodTypeId', foodTypeId);
      formData.append('categoryId', categoryId);
      formData.append('cityId', cityId);

      const config = {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      // Llamar directamente al backend
      const response = await axios.post(`${backendApiUrl}/ads`, formData, config);

      if (response.status === 201) {
        const newAdId = response.data.id;
        router.push(`/pagar/${newAdId}`);
      }
    } catch (err: any) {
      console.error('Error al crear el anuncio:', err);
      setError(err.response?.data?.error || 'Ocurrió un error al crear el anuncio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - Crear Nuevo Anuncio</title>
      </Head>
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Crear un Nuevo Anuncio</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Título del Anuncio</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Precio Regular ($)</label>
                <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="priceOffer" className="block text-sm font-medium text-gray-700">Precio de Oferta ($)</label>
                <input type="number" id="priceOffer" value={priceOffer} onChange={(e) => setPriceOffer(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label htmlFor="foodType" className="block text-sm font-medium text-gray-700">Tipo de Comida</label>
              <select id="foodType" value={foodTypeId} onChange={(e) => setFoodTypeId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                {foodTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Categoría del Anuncio</label>
              <select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name} (Precio: ${cat.price}, Duración: {cat.durationDays} días)</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">Ciudad</label>
              <select id="city" value={cityId} onChange={(e) => setCityId(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                {cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">Imagen del Anuncio</label>
              <input type="file" id="image" accept="image/*" onChange={handleImageChange} required className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            </div>
            <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400">
              {loading ? 'Guardando...' : 'Continuar al Pago'}
            </button>
            {error && <p className="text-red-500 text-center">{error}</p>}
          </form>
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
  )
}
