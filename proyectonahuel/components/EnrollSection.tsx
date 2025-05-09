'use client';

import EnrollButton from './EnrollButton';

interface EnrollSectionProps {
  courseId: string;
  price: number;
  userHasCourse: boolean;
}

const EnrollSection = ({ courseId, price, userHasCourse }: EnrollSectionProps) => {
  return (
    <div>
      <EnrollButton 
        courseId={courseId} 
        price={price} 
        userHasCourse={userHasCourse} 
      />
      
      {userHasCourse && (
        <div className="mt-4 bg-green-50 p-3 rounded-md">
          <p className="text-green-800 text-sm">
            ✓ Ya tienes acceso a este curso. Puedes verlo completo.
          </p>
        </div>
      )}
    </div>
  );
};

export default EnrollSection; 