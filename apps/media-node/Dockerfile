FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV MEDIA_DIR=/app/media

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY media ./media

EXPOSE 8080

CMD ["npm", "start"]