/**
 * Script para crear un usuario administrador en la base de datos
 * Ejecutar con: node src/scripts/create-admin.js
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

async function createAdminUser() {
  if (!process.env.MONGODB_URI) {
    console.error('Error: La variable MONGODB_URI no está definida en .env.local');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Conectado a MongoDB');

    const db = client.db(process.env.MONGODB_DB || 'nahuel-cursos');
    const usuariosCollection = db.collection('usuarios');

    // Verificar si el email de administrador ya existe
    const adminEmail = process.env.ADMIN_EMAIL || 'joaquinperez028@gmail.com';
    const existingUser = await usuariosCollection.findOne({ email: adminEmail });

    if (existingUser) {
      console.log(`El usuario con email ${adminEmail} ya existe.`);
      
      // Si existe pero no es admin, actualizarlo a admin
      if (!existingUser.admin) {
        await usuariosCollection.updateOne(
          { email: adminEmail },
          { $set: { admin: true } }
        );
        console.log(`El usuario ${adminEmail} ha sido actualizado a administrador.`);
      } else {
        console.log(`El usuario ${adminEmail} ya es administrador.`);
      }
      
      process.exit(0);
    }

    // Crear salt y hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || '123', 
      salt
    );

    // Crear el usuario administrador
    const result = await usuariosCollection.insertOne({
      nombre: 'Administrador',
      email: adminEmail,
      password: passwordHash,
      admin: true,
      cursosComprados: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Usuario administrador creado con ID: ${result.insertedId}`);
    console.log(`Email: ${adminEmail}`);
    console.log('Contraseña: La configurada en .env.local o "123" por defecto');

  } catch (error) {
    console.error('Error al crear el usuario administrador:', error);
  } finally {
    await client.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

createAdminUser(); 