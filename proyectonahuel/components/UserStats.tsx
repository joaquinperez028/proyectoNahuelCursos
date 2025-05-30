import { useState, useEffect } from 'react';

type StatCardProps = {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgClass: string;
};

function StatCard({ title, value, icon, bgClass }: StatCardProps) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (value <= 0) {
      setCount(0);
      return;
    }
    
    let start = 0;
    const incrementAmount = value > 100 ? Math.floor(value / 25) : 1;
    const timer = setInterval(() => {
      start += incrementAmount;
      if (start > value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 30);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className={`rounded-lg shadow-lg p-4 ${bgClass} transition-transform duration-300 hover:scale-105`}>
      <div className="flex items-center">
        <div className="p-3 rounded-full bg-white bg-opacity-20 mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-white opacity-75">{title}</p>
          <h3 className="text-2xl font-bold text-white">{count}</h3>
        </div>
      </div>
    </div>
  );
}

type UserStatsProps = {
  totalCourses: number;
  completedCourses: number;
  certificatesEarned: number;
};

export default function UserStats({
  totalCourses,
  completedCourses,
  certificatesEarned
}: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <StatCard
        title="Cursos Inscritos"
        value={totalCourses}
        bgClass="bg-gradient-to-r from-[#007bff] to-[#0056b3]"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#007bff]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9l-11-6zM18.82 9L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
          </svg>
        }
      />
      
      <StatCard
        title="Cursos Completados"
        value={completedCourses}
        bgClass="bg-gradient-to-r from-[#4CAF50] to-[#388E3C]"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#4CAF50]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
          </svg>
        }
      />
      
      <StatCard
        title="Certificados"
        value={certificatesEarned}
        bgClass="bg-gradient-to-r from-[#ff9800] to-[#f57c00]"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#ff9800]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2zm0 4.33l-.89 2.67L8.44 10l2.67.89L12 13.56l.89-2.67L15.56 10l-2.67-.89L12 6.33z"/>
          </svg>
        }
      />
    </div>
  );
} 