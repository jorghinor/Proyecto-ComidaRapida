import React from 'react';
import Image from 'next/image'; // Usar el componente Image de Next.js para optimización

// Mapa que asocia el slug de cada tipo de comida con la ruta de su icono
const iconMap: { [key: string]: string } = {
  saltenas: '/icons/salteña.png',
  empanadas: '/icons/empanada.png',
  sandwich: '/icons/sandwich.png',
  hamburguesas: '/icons/hamburguesa.png',
  pizzas: '/icons/pizza.png',
  tacos: '/icons/tacos.png',
  piqueos: '/icons/piqueo.png',
  // Asumimos que 'pollo' es un slug que podrías tener
  pollo: '/icons/pollo.png', 
};

// Un icono genérico de respaldo por si no se encuentra uno específico
const genericIcon = '/icons/almuerzo.png'; // Corregido para usar una imagen que sí existe

interface FoodTypeIconProps {
  slug: string;
}

export default function FoodTypeIcon({ slug }: FoodTypeIconProps) {
  const iconSrc = iconMap[slug] || genericIcon;

  return (
    <Image
      src={iconSrc}
      alt={`${slug} icon`}
      width={40} // Definir el ancho
      height={40} // Definir la altura
      className="mb-2" // Margen inferior
    />
  );
}
