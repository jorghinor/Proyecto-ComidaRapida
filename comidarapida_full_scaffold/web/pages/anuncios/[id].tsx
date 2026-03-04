import { useRouter } from 'next/router';
import Head from 'next/head';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react'; // Importar useState
import { Badge } from '../../src/components/AdCard';
import Header from '../../components/Header';
import RatingStars from '../../components/RatingStars'; // Importar componente de estrellas

const HeartIcon = () => (
  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const fetcher = (url: string) => axios.get(url).then(res => res.data);

export default function AdDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const { data: ad, error, mutate } = useSWR(id ? `/api/proxy/public/ads/${id}` : null, fetcher);

  // Estados para el formulario de nueva reseña
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      mutate({ ...ad, likes: (ad.likes || 0) + 1 }, false); 
      await axios.post(`/api/proxy/ads/${ad.id}/like`);
      mutate();
    } catch (error) {
      console.error('Error al dar "Me gusta":', error);
      mutate();
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRating === 0) {
      setReviewError('Debes seleccionar una calificación.');
      return;
    }
    setIsSubmitting(true);
    setReviewError('');

    try {
      await axios.post(`/api/proxy/ads/${id}/reviews`, {
        rating: newRating,
        comment: newComment,
      }, {
        headers: { Authorization: `Bearer ${session?.accessToken}` }
      });
      // Limpiar formulario y recargar datos
      setNewRating(0);
      setNewComment('');
      mutate();
    } catch (err: any) {
      setReviewError(err.response?.data?.error || 'No se pudo enviar la reseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) return <div>Error al cargar el anuncio.</div>;
  if (!ad) return <div>Cargando anuncio...</div>;

  const isOwner = session && session.user && session.user.id === ad.clientId;

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>ComidaRapida - {ad.title}</title>
        <meta name="description" content={ad.description} />
      </Head>
      <Header />

      <main className="flex-grow max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-96 bg-gray-100">
            <img src={ad.imageUrl || '/demo/saltena.jpg'} alt={ad.title} className="object-cover w-full h-full" />
            <Badge discount={ad.discountPercent} />
          </div>
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-2">{ad.title}</h1>
            <div className="mb-4">
              <RatingStars rating={ad.averageRating} reviewCount={ad.reviewCount} size="lg" />
            </div>
            <p className="text-gray-700 mb-4">{ad.description}</p>

            {/* ... resto de la información del anuncio ... */}
          </div>
        </div>

        {/* Sección de Reseñas */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">Reseñas</h2>
          
          {/* Formulario para nueva reseña (solo para usuarios logueados) */}
          {session && !isOwner && (
            <form onSubmit={handleReviewSubmit} className="mb-6 p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Deja tu reseña</h3>
              <div className="flex items-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`w-8 h-8 cursor-pointer ${newRating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe un comentario (opcional)..."
                className="w-full p-2 border rounded-md"
                rows={3}
              />
              <button type="submit" disabled={isSubmitting} className="mt-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400">
                {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
              </button>
              {reviewError && <p className="text-red-500 mt-2">{reviewError}</p>}
            </form>
          )}

          {/* Lista de reseñas existentes */}
          {ad.Reviews && ad.Reviews.length > 0 ? (
            <div className="space-y-4">
              {ad.Reviews.map((review: any) => (
                <div key={review.id} className="border-b pb-4">
                  <RatingStars rating={review.rating} size="sm" />
                  <p className="text-gray-800 my-1">{review.comment}</p>
                  <p className="text-sm text-gray-500">
                    - {review.user.fullName || 'Anónimo'}, {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p>Este anuncio todavía no tiene reseñas. ¡Sé el primero en dejar una!</p>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-4 px-6 text-center">
        <p>&copy; {new Date().getFullYear()} ComidaRapida. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
