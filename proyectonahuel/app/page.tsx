import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  // Datos de testimonios de estudiantes
  const testimonials = [
    {
      id: 1,
      name: "María González",
      role: "Desarrolladora Frontend",
      comment: "Los cursos de programación me ayudaron a conseguir mi primer trabajo como desarrolladora. La calidad del contenido es excepcional.",
      avatar: "/images/avatars/avatar-1.jpg"
    },
    {
      id: 2,
      name: "Carlos Rodríguez",
      role: "Diseñador UX/UI",
      comment: "Después de completar los cursos de diseño, pude mejorar significativamente mi portafolio y atraer nuevos clientes.",
      avatar: "/images/avatars/avatar-2.jpg"
    },
    {
      id: 3,
      name: "Laura Martínez",
      role: "Especialista en Marketing Digital",
      comment: "Los conocimientos adquiridos en los cursos de marketing me permitieron implementar estrategias efectivas que aumentaron las ventas de mi negocio.",
      avatar: "/images/avatars/avatar-3.jpg"
    }
  ];

  return (
    <div className="bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-[var(--primary)] blur-[150px]"></div>
          <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[var(--secondary)] blur-[150px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold sm:text-5xl md:text-6xl bg-gradient-to-r from-[var(--primary-light)] via-[var(--accent)] to-[var(--secondary-light)] bg-clip-text text-transparent pb-3 animate-fade-in">
              Aprende con los mejores cursos online
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto text-[var(--neutral-200)]">
              Accede a cursos de alta calidad impartidos por expertos. Aprende a tu ritmo, desde cualquier lugar.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/cursos"
                className="group relative px-8 py-4 rounded-lg overflow-hidden bg-[var(--primary)] text-[var(--neutral-100)] font-medium text-lg hover:bg-[var(--primary-dark)] transition-colors duration-300 flex items-center justify-center"
              >
                <span className="relative z-10">Ver todos los cursos</span>
                <span className="absolute bottom-0 left-0 h-1 w-full bg-[var(--accent)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
              
              <Link
                href="/cursos/destacados"
                className="group relative px-8 py-4 rounded-lg bg-[var(--card)] text-[var(--neutral-100)] font-medium text-lg hover:bg-[var(--card-hovered)] transition-colors duration-300 flex items-center justify-center border border-[var(--border)]"
              >
                <span className="relative z-10">Cursos destacados</span>
                <span className="absolute bottom-0 left-0 h-1 w-full bg-[var(--secondary)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías de cursos */}
      <section className="py-16 bg-[var(--neutral-900)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-[var(--neutral-100)]">Categorías populares</h2>
          <p className="text-center text-[var(--neutral-300)] mb-12 max-w-2xl mx-auto">Explora nuestras categorías y encuentra el curso perfecto para potenciar tus habilidades.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                name: 'Programación', 
                icon: '💻', 
                color: 'from-blue-700 to-blue-500',
                description: 'Aprende lenguajes de programación, desarrollo web y móvil con proyectos prácticos.'
              },
              { 
                name: 'Diseño', 
                icon: '🎨', 
                color: 'from-purple-700 to-purple-500',
                description: 'Domina herramientas de diseño gráfico, UX/UI y creación de interfaces modernas.'
              },
              { 
                name: 'Marketing', 
                icon: '📊', 
                color: 'from-red-700 to-red-500',
                description: 'Estrategias de marketing digital, SEO, redes sociales y analítica de datos.'
              },
              { 
                name: 'Negocios', 
                icon: '💼', 
                color: 'from-green-700 to-green-500',
                description: 'Emprendimiento, gestión empresarial, finanzas y liderazgo para crecer profesionalmente.'
              }
            ].map((categoria) => (
              <div key={categoria.name} className="card-transition bg-[var(--card)] rounded-xl overflow-hidden hover:bg-[var(--card-hovered)] border border-[var(--border)]">
                <div className="h-2 bg-gradient-to-r ${categoria.color}"></div>
                <div className="p-6">
                  <div className="text-4xl mb-4">{categoria.icon}</div>
                  <h3 className="text-xl font-semibold text-[var(--neutral-100)] mb-2">{categoria.name}</h3>
                  <p className="text-[var(--neutral-300)] mb-4">
                    {categoria.description}
                  </p>
                  <Link
                    href={`/cursos?categoria=${categoria.name.toLowerCase()}`}
                    className="inline-flex items-center text-[var(--primary-light)] font-medium hover:text-[var(--accent)] transition-colors"
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
      <section className="py-16 bg-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-[var(--neutral-100)]">¿Por qué elegirnos?</h2>
          <p className="text-center text-[var(--neutral-300)] mb-12 max-w-2xl mx-auto">Nuestros cursos están diseñados para ofrecerte la mejor experiencia de aprendizaje.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Contenido de calidad',
                description: 'Todos nuestros cursos son creados por expertos en la materia con años de experiencia.',
                icon: (
                  <svg className="w-10 h-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )
              },
              {
                title: 'Aprende a tu ritmo',
                description: 'Accede a los cursos cuando quieras y desde donde quieras, sin presiones ni horarios.',
                icon: (
                  <svg className="w-10 h-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                )
              },
              {
                title: 'Comunidad de apoyo',
                description: 'Únete a una comunidad de estudiantes donde podrás resolver dudas y compartir conocimientos.',
                icon: (
                  <svg className="w-10 h-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                )
              },
            ].map((feature, index) => (
              <div key={index} className="p-6 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] card-transition">
                <div className="mb-5">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-[var(--neutral-100)] mb-3">{feature.title}</h3>
                <p className="text-[var(--neutral-300)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16 bg-[var(--neutral-900)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-4 text-[var(--neutral-100)]">Lo que dicen nuestros estudiantes</h2>
          <p className="text-center text-[var(--neutral-300)] mb-12 max-w-2xl mx-auto">Historias de éxito de quienes ya han completado nuestros cursos.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="p-6 bg-[var(--card)] rounded-xl shadow-xl border border-[var(--border)] card-transition">
                <div className="flex items-center mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-[var(--neutral-800)] flex items-center justify-center text-[var(--primary)]">
                    {testimonial.avatar ? (
                      <Image 
                        src={testimonial.avatar} 
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-xl font-bold">{testimonial.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--neutral-100)]">{testimonial.name}</h4>
                    <p className="text-sm text-[var(--neutral-400)]">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-[var(--neutral-300)] italic">"{testimonial.comment}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute right-1/3 top-0 h-[400px] w-[400px] rounded-full bg-[var(--secondary)] blur-[120px]"></div>
          <div className="absolute left-1/3 bottom-0 h-[400px] w-[400px] rounded-full bg-[var(--primary)] blur-[120px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-[var(--primary-light)] via-[var(--accent)] to-[var(--secondary-light)] bg-clip-text text-transparent">
            ¿Listo para comenzar tu aprendizaje?
          </h2>
          <p className="text-xl max-w-3xl mx-auto mb-10 text-[var(--neutral-200)]">
            Únete a miles de estudiantes que ya están mejorando sus habilidades con nuestros cursos.
          </p>
          <Link
            href="/cursos"
            className="inline-block bg-[var(--accent)] text-[var(--neutral-100)] px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300 transform hover:scale-105"
          >
            Explorar cursos
          </Link>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="py-16 bg-[var(--card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '10,000+', label: 'Estudiantes' },
              { value: '100+', label: 'Cursos' },
              { value: '50+', label: 'Instructores' },
              { value: '98%', label: 'Satisfacción' }
            ].map((stat, index) => (
              <div key={index} className="p-4">
                <p className="text-3xl md:text-4xl font-bold text-[var(--accent)]">{stat.value}</p>
                <p className="text-[var(--neutral-300)]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
