import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl">
              Aprende con los mejores cursos online
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              Accede a cursos de alta calidad impartidos por expertos. Aprende a tu ritmo, desde cualquier lugar.
            </p>
            <div className="mt-10">
              <Link
                href="/cursos"
                className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-medium text-lg hover:bg-gray-100 transition-colors"
              >
                Ver todos los cursos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías de cursos */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Categorías populares</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {['Programación', 'Diseño', 'Marketing', 'Negocios'].map((categoria) => (
              <div key={categoria} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{categoria}</h3>
                  <p className="text-gray-600 mb-4">
                    Descubre los mejores cursos de {categoria.toLowerCase()}.
                  </p>
                  <Link
                    href={`/cursos?categoria=${categoria.toLowerCase()}`}
                    className="text-blue-600 font-medium hover:text-blue-800"
                  >
                    Explorar cursos &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Características */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué elegirnos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Contenido de calidad',
                description: 'Todos nuestros cursos son creados por expertos en la materia con años de experiencia.',
              },
              {
                title: 'Aprende a tu ritmo',
                description: 'Accede a los cursos cuando quieras y desde donde quieras, sin presiones ni horarios.',
              },
              {
                title: 'Comunidad de apoyo',
                description: 'Únete a una comunidad de estudiantes donde podrás resolver dudas y compartir conocimientos.',
              },
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">¿Listo para comenzar tu aprendizaje?</h2>
          <p className="text-xl max-w-3xl mx-auto mb-10">
            Únete a miles de estudiantes que ya están mejorando sus habilidades con nuestros cursos.
          </p>
          <Link
            href="/cursos"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-md font-medium text-lg hover:bg-gray-100 transition-colors"
          >
            Explorar cursos
          </Link>
        </div>
      </section>
    </div>
  );
}
