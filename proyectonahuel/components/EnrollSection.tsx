'use client';

import EnrollButton from './EnrollButton';

interface EnrollSectionProps {
  courseId: string;
  price: number;
  userHasCourse: boolean;
  onSale?: boolean;
  discountPercentage?: number;
  discountedPrice?: number;
}

const EnrollSection = ({ 
  courseId, 
  price, 
  userHasCourse,
  onSale = false,
  discountPercentage = 0,
  discountedPrice
}: EnrollSectionProps) => {
  // Calcular el precio con descuento si no viene provisto
  const finalPrice = onSale && discountPercentage > 0
    ? discountedPrice || price - (price * (discountPercentage / 100))
    : price;

  if (userHasCourse) {
    return (
      <button
        disabled
        className="w-full bg-gray-400 text-white py-3 px-4 rounded-lg font-medium opacity-75 cursor-not-allowed"
      >
        Ya estás inscrito
      </button>
    );
  }

  if (finalPrice <= 0) {
    return (
      <EnrollButton 
        courseId={courseId} 
        price={0} 
        label="Inscribirme gratis" 
      />
    );
  }

  return (
    <EnrollButton 
      courseId={courseId} 
      price={finalPrice} 
      label={`Comprar curso${onSale ? ' (Oferta)' : ''}`}
    />
  );
};

export default EnrollSection; 