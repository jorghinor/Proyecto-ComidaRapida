import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import AdCard from './AdCard';

// Usar la URL del backend directamente
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function RecommendedAds() {
  // Llamar directamente al backend
  const { data: recommendedAds, error } = useSWR(`${backendApiUrl}/ads/recommended`, fetcher);

  if (error) return null;
  if (!recommendedAds) return <div className="text-center">Cargando recomendados...</div>;
  if (recommendedAds.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-4">Recomendados para Ti</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendedAds.map((ad: any) => (
          <AdCard key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
