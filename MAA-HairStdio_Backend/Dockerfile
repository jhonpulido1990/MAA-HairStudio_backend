# ================================
# STAGE 1: Build
# ================================
FROM node:20.11-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Instalar TODAS las dependencias (incluyendo devDependencies para compilar)
RUN npm install
# Alternativa más limpia:
RUN npm ci
RUN npm cache clean --force

# Copiar código fuente
COPY src ./src

# Compilar aplicación
RUN npm run build

# ================================
# STAGE 2: Production
# ================================
FROM node:20.11-alpine AS production

# Establecer entorno de producción
ENV NODE_ENV=production

WORKDIR /app

# Copiar package.json para instalar solo dependencias de producción
COPY package*.json ./

# Instalar solo dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar aplicación compilada desde builder
COPY --from=builder /app/dist ./dist

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/main.js"]
