# LaundriX frontend — Vite build served by nginx
# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Vite inlines VITE_* variables at build time, so they must be present as build
# args. Values are supplied by docker-compose (or `docker build --build-arg`).
ARG VITE_DEV_ENV
ARG VITE_RAZORPAY_KEY_ID
ARG VITE_EMAILJS_SERVICE_ID
ARG VITE_EMAILJS_TEMPLATE_ID
ARG VITE_EMAILJS_PUBLIC_KEY
ENV VITE_DEV_ENV=$VITE_DEV_ENV \
    VITE_RAZORPAY_KEY_ID=$VITE_RAZORPAY_KEY_ID \
    VITE_EMAILJS_SERVICE_ID=$VITE_EMAILJS_SERVICE_ID \
    VITE_EMAILJS_TEMPLATE_ID=$VITE_EMAILJS_TEMPLATE_ID \
    VITE_EMAILJS_PUBLIC_KEY=$VITE_EMAILJS_PUBLIC_KEY

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
