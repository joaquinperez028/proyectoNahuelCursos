# Configuración de Autenticación con Google para Nahuel Cursos

Este documento explica cómo configurar la autenticación de Google para tu aplicación Nahuel Cursos.

## Paso 1: Crear un proyecto en Google Cloud Platform

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto (o selecciona uno existente)
4. Anota el ID del proyecto para usarlo más adelante

## Paso 2: Configurar las credenciales de OAuth

1. En el menú lateral, ve a "APIs & Services" > "Credentials"
2. Haz clic en "Create Credentials" y selecciona "OAuth client ID"
3. Si es la primera vez que configuras OAuth, tendrás que configurar la pantalla de consentimiento:
   - Selecciona "External" como tipo de usuario
   - Completa los campos requeridos (nombre de la aplicación, correo electrónico de soporte, etc.)
   - En los "Scopes" agrega ".../auth/userinfo.email" y ".../auth/userinfo.profile"
   - Guarda los cambios

4. Vuelve a "Credentials" y haz clic en "Create Credentials" > "OAuth client ID"
5. Selecciona "Web application" como tipo de aplicación
6. Asigna un nombre (por ejemplo, "Nahuel Cursos Web")
7. En "Authorized JavaScript origins" agrega:
   - Para desarrollo: `http://localhost:3000`
   - Para producción: tu dominio (ej. `https://nahuel-cursos.com`)

8. En "Authorized redirect URIs" agrega:
   - Para desarrollo: `http://localhost:3000/api/auth/callback/google`
   - Para producción: `https://nahuel-cursos.com/api/auth/callback/google`

9. Haz clic en "Create"
10. Se te mostrarán el "Client ID" y "Client Secret". Guarda ambos valores.

## Paso 3: Configurar las variables de entorno en tu aplicación

1. Abre tu archivo `.env.local`
2. Agrega o actualiza las siguientes variables:

```
# Google Authentication
GOOGLE_CLIENT_ID=tu-client-id-aquí
GOOGLE_CLIENT_SECRET=tu-client-secret-aquí
```

3. Guarda el archivo
4. Reinicia el servidor de desarrollo si está en ejecución

## Paso 4: Verificación

1. Inicia el servidor de desarrollo: `npm run dev`
2. Abre `http://localhost:3000/auth/login`
3. Haz clic en "Iniciar sesión con Google"
4. Deberías ver la pantalla de consentimiento de Google y poder iniciar sesión
5. Después de iniciar sesión, deberías ser redirigido a la página especificada (por defecto: `/cursos`)

## Solución de problemas

### Error "redirect_uri_mismatch"

Este error ocurre cuando la URI de redirección no coincide con las configuradas en la consola de Google.

**Solución**: Verifica que la URI de redirección en la consola de Google coincida exactamente con la URL que está usando tu aplicación, incluyendo el protocolo (http/https) y el puerto.

### Error "invalid_client"

Este error puede ocurrir si las credenciales de cliente no son correctas.

**Solución**: Verifica que el Client ID y Client Secret estén correctamente copiados en tu archivo `.env.local`.

### Error al crear usuario

Si hay problemas para crear nuevos usuarios en la base de datos:

**Solución**: Verifica los registros de la aplicación para identificar errores específicos y asegúrate de que la conexión a la base de datos esté funcionando correctamente.

## Referencias útiles

- [Documentación de NextAuth.js para Google Provider](https://next-auth.js.org/providers/google)
- [Documentación de Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2) 