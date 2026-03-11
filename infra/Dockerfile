# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Injeta a URL da API em tempo de build
ARG API_BASE_URL=http://localhost:8080
RUN sed -i "s|http://localhost:8080|${API_BASE_URL}|g" src/environments/environment.ts

RUN npm run build

# ---- Serve Stage ----
FROM nginx:1.27-alpine

COPY --from=builder /app/dist/hack-vp-site/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
