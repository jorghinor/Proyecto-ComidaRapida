interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
}

const RatingStars = ({ rating, reviewCount, size = 'md' }: RatingStarsProps) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  const starSizeClass = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  return (
    <div className="flex items-center">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <svg key={`full-${i}`} className={`${starSizeClass} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg className={`${starSizeClass} text-yellow-400`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" clipPath="url(#half)" />
            <defs>
              <clipPath id="half">
                <rect x="0" y="0" width="10" height="20" />
              </clipPath>
            </defs>
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg key={`empty-${i}`} className={`${starSizeClass} text-gray-300`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
          </svg>
        ))}
      </div>
      {reviewCount !== undefined && (
        <span className="ml-2 text-sm text-gray-600">
          ({reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
