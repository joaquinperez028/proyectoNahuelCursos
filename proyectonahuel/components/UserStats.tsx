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

  // Determinar el color del círculo basado en el título
  let circleClass = "";
  let iconClass = "";
  
  if (title.includes("Cursos Inscritos")) {
    circleClass = "bg-blue-100 border-2 border-blue-200";
    iconClass = "text-blue-600";
  } else if (title.includes("Cursos Completados")) {
    circleClass = "bg-green-100 border-2 border-green-200";
    iconClass = "text-green-600";
  } else if (title.includes("Certificados")) {
    circleClass = "bg-orange-100 border-2 border-orange-200";
    iconClass = "text-orange-600";
  }

  return (
    <div className={`rounded-lg shadow-lg p-4 ${bgClass} transition-transform duration-300 hover:scale-105`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full mr-4 ${circleClass}`}>
          <div className={iconClass}>
            {icon}
          </div>
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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 14l9-5-9-5-9 5 9 5z" />
            <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
          </svg>
        }
      />
      
      <StatCard
        title="Cursos Completados"
        value={completedCourses}
        bgClass="bg-gradient-to-r from-[#4CAF50] to-[#388E3C]"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      
      <StatCard
        title="Certificados"
        value={certificatesEarned}
        bgClass="bg-gradient-to-r from-[#ff9800] to-[#f57c00]"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        }
      />
    </div>
  );
} 