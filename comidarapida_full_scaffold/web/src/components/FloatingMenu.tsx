import React from 'react';
import useSWR from 'swr';
import axios from 'axios';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function FloatingMenu() {
  const { data: foodTypes, error } = useSWR('/api/proxy/food-types', fetcher, { refreshInterval: 60000 });

  if (error) return <div>Error al cargar tipos de comida</div>;
  if (!foodTypes) return <div>Cargando...</div>;

  return (
    <nav className="fixed right-4 top-28 bg-white/80 backdrop-blur p-3 rounded-xl shadow-lg z-40">
      <h3 className="font-semibold mb-2">BUSCO OFERTAS DE:</h3>
      <ul>
        {(foodTypes || []).map((item: any) => (
          <li key={item.slug} className="text-sm py-1">
            <a href={`/tipo/${item.slug}`} className="flex justify-between items-center">
              <span className="font-medium">{item.name}</span>
              <span className="text-xs text-gray-600">({item.adCount})</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
