# Plataforma de Cursos Online.

Esta plataforma permite la venta de cursos en línea con manejo de usuarios, roles de administrador, reseñas y reproducción de videos.

## Características principales

- Autenticación con cuentas de Google (OAuth)
- Gestión de contenido por administradores 
- Manejo de videos a través de MUX
- Reseñas y valoraciones de cursos
- Compra de cursos (simulada)
- Base de datos en MongoDB

## Configuración

### Requisitos previos

- Node.js y npm
- Cuenta en MongoDB Atlas
- Cuenta en MUX para gestión de videos
- Credenciales OAuth de Google

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# MUX
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret

# Admin emails (separados por coma)
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### Instalación

1. Instala las dependencias:

```bash
npm install
```

2. Inicia el servidor de desarrollo:

```bash
npm run dev
```

3. Abre http://localhost:3000 en tu navegador

## Roles y permisos

La plataforma tiene dos roles principales:

### Usuario

- Puede iniciar sesión con Google
- Puede comprar cursos
- Puede ver los cursos que ha comprado
- Puede añadir reseñas y valoraciones a los cursos comprados
- Puede editar o eliminar sus propias reseñas

### Administrador

- Puede hacer todo lo que un usuario normal puede hacer
- Puede crear, editar y eliminar cursos
- Puede eliminar reseñas de cualquier usuario (moderación)
- Puede acceder al panel de administración

## Estructura del proyecto

- `/app`: Páginas y API endpoints (Next.js App Router)
- `/components`: Componentes reutilizables
- `/lib`: Utilidades (MongoDB, MUX, etc.)
- `/models`: Modelos de datos para MongoDB (Mongoose)
- `/types`: TypeScript types/interfaces

## Uso de MUX para videos

La plataforma utiliza MUX para la gestión y reproducción de videos:

1. Los administradores suben una URL de video al crear un curso
2. La API de MUX procesa el video y genera IDs para reproducción
3. Los videos se reproducen con `@mux/mux-player-react`
4. La reproducción requiere tokens firmados para mayor seguridad

## Despliegue

Esta aplicación está configurada para desplegarse fácilmente en Vercel:

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno en Vercel
3. Despliega la aplicación

## Personalización

Para personalizar la plataforma:

- Modifica los estilos en `/app/globals.css` o componentes individuales
- Ajusta los modelos de datos en `/models` según tus necesidades
- Agrega más páginas o funcionalidades en `/app`

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerir cambios o mejoras.

## Licencia

Este proyecto está bajo la licencia MIT.
