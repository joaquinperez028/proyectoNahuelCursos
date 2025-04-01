# Nahuel Cursos - Plataforma de Cursos Online

Una plataforma moderna para la venta y gestión de cursos online. Desarrollada con Next.js, MongoDB, NextAuth.js y Tailwind CSS.

## Características

- 🔐 Autenticación de usuarios con NextAuth.js
- 👤 Perfiles de usuario personalizados
- 📚 Catálogo de cursos con búsqueda
- 🛒 Carrito de compras para cursos
- 💳 Integración con pasarela de pagos (a implementar)
- 📋 Panel de administración para gestionar cursos
- 📱 Diseño responsivo con Tailwind CSS
- 🎥 Reproducción de videos para los cursos

## Requisitos previos

- Node.js 18 o superior
- MongoDB Atlas o una instancia local de MongoDB
- NPM o Yarn

## Configuración

1. Clona el repositorio:
```bash
git clone https://github.com/tu-usuario/nahuel-cursos.git
cd nahuel-cursos
```

2. Instala las dependencias:
```bash
npm install
# o
yarn install
```

3. Crea un archivo `.env.local` basado en `.env.local.example` con tus variables de entorno:
```bash
cp .env.local.example .env.local
# Edita el archivo .env.local con tus credenciales
```

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
```

5. Abre [http://26.176.79.169:3000](http://26.176.79.169:3000) en tu navegador para ver la aplicación.

## Estructura del proyecto

```
nahuel-cursos/
├── public/            # Archivos estáticos
├── src/
│   ├── app/           # Rutas y páginas de la aplicación
│   │   ├── admin/     # Panel de administración
│   │   ├── api/       # Rutas de la API
│   │   ├── auth/      # Autenticación
│   │   ├── components/# Componentes reutilizables
│   │   ├── curso/     # Páginas de cursos
│   │   ├── lib/       # Utilidades y conexión a DB
│   │   └── ...
│   └── ...
├── tailwind.config.js # Configuración de Tailwind CSS
└── ...
```

## Desarrollo

### Comandos útiles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Construye la aplicación para producción
- `npm start`: Inicia la aplicación en modo producción
- `npm run lint`: Ejecuta el linter para verificar el código

## Licencia

[MIT](LICENSE)

## Contacto

Para cualquier consulta o sugerencia, contáctanos a través de [tu-email@ejemplo.com](mailto:tu-email@ejemplo.com).
