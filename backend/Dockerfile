FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# The Prisma schema + migrations live at the repo root (/prisma), outside this
# backend build context. Copy them in so prisma generate / migrate deploy work.
COPY prisma ./prisma
# Generate the Prisma client so the built app can instantiate PrismaClient.
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runtime
RUN apk add --no-cache openssl
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
