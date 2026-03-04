import React from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import axios from 'axios';
import RatingStars from '../../components/RatingStars'; // Importar el nuevo componente

// SVG Star Icon
export const StarIcon = () => (
  <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
  </svg>
);

// SVG Heart Icon
const HeartIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

export function Badge({ discount }: { discount?: number }){
  if(!discount || discount < 10) return null;

  let colorClass = '';
  let shapeIndicator = null;

  if(discount >= 50) {
    colorClass = 'bg-yellow-500';
    shapeIndicator = <StarIcon />;
  } else if(discount >= 25) {
    colorClass = 'bg-orange-500';
  } else {
    colorClass = 'bg-red-600';
  }

  return (
    <div className="absolute left-0 top-0 m-2">
      <div className={`flex items-center text-xs text-white font-bold px-2 py-1 rounded ${colorClass}`}>
        -{Number(discount).toFixed(0)}%
        {shapeIndicator}
      </div>
    </div>
  )
}

export default function AdCard({ ad }: any){
  const { data: session } = useSession();
  const isOwner = session && session.user && session.user.id === ad.clientId;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await axios.post(`/api/proxy/ads/${ad.id}/like`);
      alert('¡Gracias por tu "Me gusta"!');
    } catch (error) {
      console.error('Error al dar "Me gusta":', error);
      alert('Hubo un error al dar "Me gusta".');
    }
  };

  return (
    <motion.article 
      className="relative bg-white rounded-lg overflow-hidden border-2 border-blue-500 shadow-lg shadow-pink-800/50" 
      whileHover={{ y: -6 }}
    >
      <Link href={`/anuncios/${ad.id}`} passHref>
        <div style={{ cursor: 'pointer' }}>
          <div className="relative h-44 bg-gray-100">
            <img src={ad.imageUrl || '/demo/saltena.jpg'} alt={ad.title} className="object-cover w-full h-full" />
            <Badge discount={ad.discountPercent} />
          </div>
          <div className="p-3">
            <h4 className="font-semibold">{ad.title}</h4>
            {/* Añadir el componente de calificación */}
            <div className="my-1">
              <RatingStars rating={ad.averageRating || 0} reviewCount={ad.reviewCount || 0} size="sm" />
            </div>
            <p className="text-sm text-gray-600 truncate">{ad.description}</p>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-lg font-bold">${ad.priceOffer ?? ad.price ?? '---'}</div>
            </div>
          </div>
        </div>
      </Link>
      <div className="p-3 pt-0 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={handleLike} className="flex items-center text-red-500 hover:text-red-600 text-sm font-medium">
            <HeartIcon /> {ad.likes || 0}
          </button>
        </div>
        <div className="flex items-center">
          {isOwner && (
            <Link href={`/anuncios/editar/${ad.id}`} style={{ marginLeft: '0.5rem', padding: '4px 8px', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>
              Editar
            </Link>
          )}
          <a className="text-sm underline ml-2" href={`https://wa.me/${ad.whatsapp || ''}`}>Contactar</a>
        </div>
      </div>
    </motion.article>
  )
}
