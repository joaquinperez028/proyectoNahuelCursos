import Link from 'next/link';
import Image from 'next/image';
import { FaGraduationCap, FaChartLine, FaLock, FaVideo } from 'react-icons/fa';
import CursosRecientes from '@/components/CursosRecientes';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 py-24 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 lg:pr-12 mb-10 lg:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Domina el mundo de las inversiones en criptomonedas
            </h1>
            <p className="text-xl mb-8">
              Aprende estrategias efectivas y fundamentos sólidos para invertir en el mercado de criptomonedas con nuestros cursos especializados.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link 
                href="/cursos" 
                className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg text-center transition-colors font-medium"
              >
                Ver cursos
              </Link>
              <Link 
                href="/about" 
                className="bg-transparent border border-white hover:bg-green-600 text-white py-3 px-6 rounded-lg text-center transition-colors font-medium"
              >
                Conoce más
              </Link>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative">
                  {/* Aquí iría una imagen o video de muestra */}
                  <div className="bg-gray-800 w-full h-full flex items-center justify-center">
                    <FaVideo className="text-5xl text-green-300" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Curso destacado</h3>
                  <p className="mb-4 text-gray-300">Fundamentos de inversión en Bitcoin y Ethereum</p>
                  <Link 
                    href="/cursos/destacado" 
                    className="inline-block bg-green-600 hover:bg-green-700 py-2 px-4 rounded text-sm font-medium transition-colors"
                  >
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cursos Recientes */}
      <CursosRecientes />
      
      {/* Características */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-green-800 mb-4">
              ¿Por qué elegir nuestros cursos?
            </h2>
            <p className="text-xl text-green-700 max-w-3xl mx-auto">
              Diseñados por expertos en inversiones, nuestros cursos te brindan las herramientas y conocimientos necesarios para navegar con confianza en el mundo de las criptomonedas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Característica 1 */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FaGraduationCap className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Contenido de calidad</h3>
              <p className="text-green-700">
                Material actualizado y completo, desarrollado por profesionales con amplia experiencia en el mercado de criptomonedas.
              </p>
            </div>
            
            {/* Característica 2 */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FaChartLine className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Estrategias efectivas</h3>
              <p className="text-green-700">
                Aprende técnicas de análisis y estrategias de inversión probadas para maximizar tus rendimientos y minimizar riesgos.
              </p>
            </div>
            
            {/* Característica 3 */}
            <div className="bg-white rounded-xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <FaLock className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-800">Acceso permanente</h3>
              <p className="text-green-700">
                Una vez comprado el curso, tendrás acceso de por vida al contenido, incluyendo todas las actualizaciones futuras.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Llamado a la acción */}
      <section className="bg-black text-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Comienza tu viaje en el mundo de las criptomonedas hoy
          </h2>
          <p className="text-xl mb-10 text-gray-300">
            Invierte en tu futuro financiero con nuestros cursos especializados
          </p>
          <Link 
            href="/cursos" 
            className="bg-green-600 text-white hover:bg-green-700 py-3 px-8 rounded-lg text-lg font-bold transition-colors inline-block"
          >
            Explorar cursos
          </Link>
        </div>
      </section>
    </div>
  );
}
