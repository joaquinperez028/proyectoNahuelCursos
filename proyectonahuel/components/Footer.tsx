const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm">© {new Date().getFullYear()} Plataforma de Cursos. Todos los derechos reservados.</p>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Términos y condiciones
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Política de privacidad
            </a>
            <a href="#" className="text-gray-300 hover:text-white text-sm">
              Contacto
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 