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

3. Crea un archivo `.env.local` basado en `.env.example` con tus variables de entorno:
```bash
cp .env.example .env.local
# Edita el archivo .env.local con tus credenciales
```

4. Ejecuta el servidor de desarrollo:
```bash
npm run dev
# o
yarn dev
```

5. Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

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

## Despliegue en Vercel

Para desplegar esta aplicación en Vercel, sigue estos pasos:

1. Haz push de tus cambios a tu repositorio de GitHub.

2. Inicia sesión en [Vercel](https://vercel.com) con tu cuenta de GitHub.

3. Selecciona "Import Project" y elige el repositorio de GitHub.

4. Configura el proyecto:
   - Framework Preset: Next.js
   - Root Directory: ./nahuel-cursos (si tu proyecto está en un subdirectorio)
   - Build Command: (dejarlo en blanco para usar el predeterminado)
   - Output Directory: (dejarlo en blanco para usar el predeterminado)

5. Configura las Variables de Entorno (desde Settings > Environment Variables):
   ```
   MONGODB_URI=mongodb+srv://usuario:contraseña@cluster0.mongodb.net/nahuel-cursos
   MONGODB_DB=nahuel-cursos
   NEXTAUTH_URL=https://tu-app.vercel.app (después de la primera implementación)
   NEXTAUTH_SECRET=un_valor_secreto_aleatorio
   GOOGLE_CLIENT_ID=tu_client_id
   GOOGLE_CLIENT_SECRET=tu_client_secret
   ADMIN_EMAIL=tu_email_administrador
   ```

6. Haz clic en "Deploy" para iniciar el despliegue.

7. Una vez completado, actualiza la variable de entorno NEXTAUTH_URL con la URL proporcionada por Vercel.

8. Actualiza la configuración de OAuth de Google para incluir la URL de callback de Vercel:
   - Añadir `https://tu-app.vercel.app/api/auth/callback/google` en URIs de redirección autorizados.

### Solución de problemas comunes de despliegue

- Si hay errores de ESLint durante la compilación, el archivo `next.config.js` incluido en este repositorio ya está configurado para ignorarlos durante la compilación.
- Para la conexión de MongoDB Atlas, asegúrate de configurar el Network Access para permitir conexiones desde cualquier IP (0.0.0.0/0).

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
