FROM node:18
WORKDIR /app

# Copiar los archivos de dependencias
COPY web/package.json ./
COPY web/package-lock.json* ./

# Instalar dependencias.
RUN npm install

# Copiar el resto del código de la aplicación
COPY web/. .

# NO copiar el esquema de Prisma del backend
# NO generar el cliente de Prisma para el frontend

EXPOSE 3000
CMD ["npm", "run", "dev"]
