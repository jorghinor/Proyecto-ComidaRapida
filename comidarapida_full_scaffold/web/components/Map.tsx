'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
// CSS de Leaflet
import 'leaflet/dist/leaflet.css';
// CSS para react-leaflet-markercluster v3
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import Link from 'next/link';
import RatingStars from './RatingStars';
// Importar el componente de la librería correcta
import MarkerClusterGroup from 'react-leaflet-markercluster';

// Arreglo para el icono por defecto de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface AdMapData {
  id: string;
  title: string;
  priceOffer: number;
  averageRating: number;
  City: {
    lat: number | null;
    lng: number | null;
  };
}

interface MapProps {
  ads: AdMapData[];
}

const Map = ({ ads }: MapProps) => {
  const defaultPosition: [number, number] = [-16.5, -68.15];

  return (
    <MapContainer center={defaultPosition} zoom={6} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      <MarkerClusterGroup>
        {ads?.map(ad => {
          if (ad.City?.lat && ad.City?.lng) {
            return (
              <Marker key={ad.id} position={[ad.City.lat, ad.City.lng]}>
                <Popup>
                  <div className="font-bold">{ad.title}</div>
                  <RatingStars rating={ad.averageRating} size="sm" />
                  <div className="text-green-600 font-semibold">${ad.priceOffer}</div>
                  <Link href={`/anuncios/${ad.id}`} className="text-blue-500 hover:underline">
                    Ver detalles
                  </Link>
                </Popup>
              </Marker>
            );
          }
          return null;
        })}
      </MarkerClusterGroup>
    </MapContainer>
  );
};

export default Map;
