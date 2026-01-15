FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
CMD npx prisma db push && npm run start:prod