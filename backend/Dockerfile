# LaundriX backend — Express + MongoDB
FROM node:20-alpine

WORKDIR /app

# Install production dependencies first to leverage Docker layer caching.
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy the rest of the source (controllers, routes, views, config, ...).
COPY . .

# The app binds a port only when NOT running on Vercel (see server.js).
EXPOSE 4000

CMD ["node", "server.js"]
