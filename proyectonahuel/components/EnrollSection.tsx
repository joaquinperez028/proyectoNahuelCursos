'use client';

import EnrollButton from './EnrollButton';

interface EnrollSectionProps {
  courseId: string;
  price: number;
  userHasCourse: boolean;
}

const EnrollSection = ({ courseId, price, userHasCourse }: EnrollSectionProps) => {
  return (
    <div className="space-y-4">
      <EnrollButton 
        courseId={courseId} 
        price={price} 
        userHasCourse={userHasCourse} 
      />
      
      {userHasCourse && (
        <div className="mt-4 bg-[rgba(5,150,105,0.1)] border border-[rgba(5,150,105,0.3)] p-3 rounded-lg">
          <p className="text-green-400 text-sm flex items-center">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Ya tienes acceso a este curso. Puedes verlo completo.
          </p>
        </div>
      )}
      
      {!userHasCourse && (
        <div className="flex items-center justify-center text-[var(--neutral-400)] text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
          </svg>
          <span>Pago 100% seguro</span>
        </div>
      )}
    </div>
  );
};

export default EnrollSection; 