import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import StatisticCounter from '../components/StatisticCounter';
import DynamicTestimonials from '../components/DynamicTestimonials';

export default function Home() {
  return (
    <div className="bg-black text-gray-200">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-900 blur-[150px]"></div>
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-green-900 blur-[150px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl bg-gradient-to-r from-blue-400 via-green-400 to-teal-400 bg-clip-text text-transparent pb-3 animate-fade-in">
              Aprende inversión financiera con los expertos
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto text-gray-300">
              Domina las estrategias de inversión en bolsa y criptomonedas. Aprende a generar ingresos pasivos y alcanzar la libertad financiera.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/cursos"
                className="group relative px-8 py-4 rounded-lg overflow-hidden bg-green-600 text-white font-medium text-lg hover:bg-green-700 transition-colors duration-300 flex items-center justify-center"
              >
                <span className="relative z-10">Ver todos los cursos</span>
                <span className="absolute bottom-0 left-0 h-1 w-full bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              
              <Link
                href="/cursos/destacados"
                className="group relative px-8 py-4 rounded-lg bg-gray-800 text-white font-medium text-lg hover:bg-gray-700 transition-colors duration-300 flex items-center justify-center border border-gray-700"
              >
                <span className="relative z-10">Cursos destacados</span>
                <span className="absolute bottom-0 left-0 h-1 w-full bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías de cursos */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Categorías especializadas</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">Explora nuestras categorías enfocadas en inversión y encuentra el camino para hacer crecer tu capital.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                name: 'Inversión en Bolsa', 
                icon: '📈', 
                color: 'from-blue-700 to-blue-500',
                description: 'Aprende a invertir en acciones, ETFs y fondos de inversión con estrategias probadas.'
              },
              { 
                name: 'Criptomonedas', 
                icon: '₿', 
                color: 'from-green-700 to-green-500',
                description: 'Domina el mundo de Bitcoin, Ethereum y otras altcoins. Aprende a operar de forma segura.'
              },
              { 
                name: 'Trading', 
                icon: '📊', 
                color: 'from-teal-700 to-teal-500',
                description: 'Estrategias de trading, análisis técnico y gestión de riesgos para mercados financieros.'
              },
              { 
                name: 'Finanzas Personales', 
                icon: '💰', 
                color: 'from-indigo-700 to-indigo-500',
                description: 'Aprende a gestionar tu dinero, crear presupuestos efectivos y planificar tu futuro financiero.'
              }
            ].map((categoria) => (
              <div key={categoria.name} className="card-transition bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 border border-gray-700">
                <div className={`h-2 bg-gradient-to-r ${categoria.color}`}></div>
                <div className="p-6">
                  <div className="text-4xl mb-4">{categoria.icon}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{categoria.name}</h3>
                  <p className="text-gray-400 mb-4">
                    {categoria.description}
                  </p>
                  <Link
                    href={`/cursos?categoria=${categoria.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="inline-flex items-center text-blue-400 font-medium hover:text-green-400 transition-colors"
                  >
                    <span>Explorar cursos</span>
                    <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">¿Por qué elegirnos?</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">Nuestros cursos están diseñados para ofrecerte la mejor experiencia de aprendizaje en inversiones.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Expertos en Inversión',
                description: 'Instructores con años de experiencia en mercados financieros y gestión de carteras de inversión.',
                icon: (
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )
              },
              {
                title: 'Contenido Actualizado',
                description: 'Información constante actualizada sobre mercados, criptomonedas y nuevas oportunidades de inversión.',
                icon: (
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )
              },
              {
                title: 'Certificación Oficial',
                description: 'Obtén certificados verificables que acreditan tus conocimientos en inversión y trading.',
                icon: (
                  <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                )
              },
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-gray-800 rounded-xl shadow-xl border border-gray-700 card-transition">
                <div className="mb-5">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios Dinámicos */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-white">Lo que dicen nuestros estudiantes</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">Historias reales de éxito de quienes ya han completado nuestros cursos.</p>
          
          <Suspense fallback={<div className="text-center py-10">Cargando testimonios...</div>}>
            <DynamicTestimonials />
          </Suspense>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute right-1/3 top-0 h-[400px] w-[400px] rounded-full bg-green-700 blur-[120px]"></div>
          <div className="absolute left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-blue-700 blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
            ¿Listo para comenzar tu camino hacia la libertad financiera?
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 text-gray-300">
            Únete a miles de inversores que ya están multiplicando su capital con nuestras estrategias probadas.
          </p>
          <Link
            href="/cursos"
            className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-green-700 transition-all duration-300 transform hover:scale-105"
          >
            Explorar cursos
          </Link>
        </div>
      </section>

      {/* Estadísticas Dinámicas */}
      <section className="py-16 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Suspense fallback={
              <div className="col-span-4 text-center py-10">Cargando estadísticas...</div>
            }>
              <StatisticCounter type="students" label="Estudiantes" />
              <StatisticCounter type="courses" label="Cursos" />
              <StatisticCounter type="instructors" label="Instructores" />
              <StatisticCounter type="satisfactionRate" label="Satisfacción" suffix="%" />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
