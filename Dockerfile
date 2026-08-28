FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
ENV NODE_ENV=production
CMD ["sh","-c","npx prisma db push --skip-generate && node --enable-source-maps node_modules/next/dist/bin/next start -p ${PORT:-3000}"]
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://localhost:3000/api/dashboard || exit 1
