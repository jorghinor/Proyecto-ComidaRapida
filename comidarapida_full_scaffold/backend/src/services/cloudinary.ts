import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

// Configurar Cloudinary con las variables de entorno
// Asegúrate de que estas variables estén disponibles en el entorno del backend
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Función para subir una imagen desde un buffer de memoria
export const uploadImage = (buffer: Buffer): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        // Opcional: puedes añadir una carpeta para organizar las imágenes
        folder: 'comidarapida_anuncios',
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          // Devolvemos la URL segura de la imagen subida
          resolve(result.secure_url);
        } else {
          reject(new Error('Cloudinary did not return a result.'));
        }
      }
    );

    // Convertimos el buffer en un stream y lo pasamos a Cloudinary
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};
