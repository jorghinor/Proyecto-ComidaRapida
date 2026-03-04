import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css";
import AdCard from './AdCard'; // Importar el AdCard

// Usar la URL del backend directamente
const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function FeaturedAdsCarousel() {
  // Llamar directamente al backend
  const { data: featuredAds, error } = useSWR(`${backendApiUrl}/featured`, fetcher);

  if (error) return <div className="text-center text-red-500">Error al cargar los anuncios destacados.</div>;
  if (!featuredAds) return <div className="text-center">Cargando destacados...</div>;
  if (featuredAds.length === 0) return null;

  return (
    <div className="mb-12 shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Anuncios Destacados</h2>
      <Carousel
        showThumbs={false}
        autoPlay
        infiniteLoop
        interval={5000}
        showStatus={false}
        centerMode
        centerSlidePercentage={25}
        className="p-4"
      >
        {featuredAds.map((ad: any) => (
          <div key={ad.id} className="p-2">
            <AdCard ad={ad} />
          </div>
        ))}
      </Carousel>
    </div>
  );
}
