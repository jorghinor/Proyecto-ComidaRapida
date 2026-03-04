import React from 'react';
import Link from 'next/link';
import FoodTypeIcon from './FoodTypeIcon'; // Importar el nuevo componente de iconos

interface CategoryCardProps {
  slug: string;
  name: string;
  adCount: number;
}

export default function CategoryCard({ slug, name, adCount }: CategoryCardProps) {
  return (
    <Link href={`/tipo/${slug}`} passHref>
      <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg shadow-md hover:shadow-xl hover:bg-blue-50 transition-all duration-300 cursor-pointer">
        <FoodTypeIcon slug={slug} /> {/* Usar el nuevo componente de iconos */}
        <h3 className="font-semibold text-gray-800">{name}</h3>
        <p className="text-sm text-gray-500">{adCount} anuncios</p>
      </div>
    </Link>
  );
}
