FROM node:18
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Generar el cliente de Prisma para el backend
RUN npx prisma generate

CMD ["npm", "run", "dev"]
