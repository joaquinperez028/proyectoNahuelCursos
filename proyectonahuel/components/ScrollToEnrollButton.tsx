'use client';

interface ScrollToEnrollButtonProps {
  className?: string;
}

const ScrollToEnrollButton = ({ className = '' }: ScrollToEnrollButtonProps) => {
  const handleClick = () => {
    document.getElementById('enroll-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <button 
      onClick={handleClick}
      className={`px-5 py-3 bg-[var(--accent)] text-white rounded-lg font-medium hover:bg-opacity-90 transition-all duration-300 transform hover:scale-105 inline-flex items-center ${className}`}
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
      </svg>
      Comprar ahora
    </button>
  );
};

export default ScrollToEnrollButton; 