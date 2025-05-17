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
                name: 'Análisis Técnico', 
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-blue-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 19h4l10.5-10.5-4-4L4 15v4z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M13.5 6.5l4 4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 12v-2m5 4H9m-4 4h14" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="5" y="4" width="2" height="8" rx="1" strokeWidth="0" fill="currentColor" />
                    <rect x="9" y="9" width="2" height="3" rx="1" strokeWidth="0" fill="currentColor" />
                    <rect x="13" y="7" width="2" height="5" rx="1" strokeWidth="0" fill="currentColor" />
                    <rect x="17" y="5" width="2" height="7" rx="1" strokeWidth="0" fill="currentColor" />
                  </svg>
                ),
                color: 'from-blue-700 to-blue-500',
                description: 'Domina el arte de los gráficos de velas japonesas y patrones de precio para predecir movimientos del mercado.'
              },
              { 
                name: 'Análisis Fundamental', 
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-green-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M15 3v4H9V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 10v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 10v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 10v6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="7" y="16" width="2" height="4" rx="0.5" strokeWidth="0" fill="currentColor" />
                    <rect x="11" y="14" width="2" height="6" rx="0.5" strokeWidth="0" fill="currentColor" />
                    <rect x="15" y="12" width="2" height="8" rx="0.5" strokeWidth="0" fill="currentColor" />
                  </svg>
                ),
                color: 'from-green-700 to-green-500',
                description: 'Aprende a evaluar el valor real de activos financieros mediante análisis de balances, ratios e informes económicos.'
              },
              { 
                name: 'Estrategias de Trading', 
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-teal-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 5h20v14H2V5z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 9l3-3 3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 17l3-3 2 2 4-4 3 3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 15h1v1h-1v-1z" strokeWidth="0" fill="currentColor" />
                    <path d="M17 11h1v1h-1v-1z" strokeWidth="0" fill="currentColor" />
                    <path d="M6 13h1v1H6v-1z" strokeWidth="0" fill="currentColor" />
                    <path d="M10 11h1v1h-1v-1z" strokeWidth="0" fill="currentColor" />
                  </svg>
                ),
                color: 'from-teal-700 to-teal-500',
                description: 'Descubre sistemas de trading probados, gestión monetaria avanzada y psicología del trader profesional.'
              },
              { 
                name: 'Finanzas Personales', 
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-indigo-400" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.77 2 2.5 6.27 2.5 11.5c0 5.23 4.27 9.5 9.5 9.5 5.23 0 9.5-4.27 9.5-9.5C21.5 6.27 17.23 2 12 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 15v1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 8v4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 6v1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.5 8.5h5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 11.5h6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path fill="currentColor" d="M11.75 7.25a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" strokeWidth="0" />
                  </svg>
                ),
                color: 'from-indigo-700 to-indigo-500',
                description: 'Aprende a gestionar tu dinero, crear presupuestos efectivos y planificar tu futuro financiero con estrategias prácticas.'
              }
            ].map((categoria) => (
              <div key={categoria.name} className="card-transition bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 border border-gray-700">
                <div className={`h-2 bg-gradient-to-r ${categoria.color}`}></div>
                <div className="p-6">
                  <div className="mb-4">{categoria.icon}</div>
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
