# 1-Bosqich: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Package.json fayllarini nusxalaymiz
COPY package*.json ./

# NPM kutubxonalarini o'rnatamiz
RUN npm ci

# Qolgan fayllar
COPY . .

# Environment argumentlari
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build qilamiz
RUN npm run build

# 2-Bosqich: Nginx
FROM nginx:alpine

# Nginx default configurationni o'chirish
RUN rm -rf /etc/nginx/conf.d/default.conf

# Bizning maxsus nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Builder'dan statik html/js/css larni Nginx ga nusxalash
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
