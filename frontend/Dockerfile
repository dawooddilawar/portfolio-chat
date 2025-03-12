# /frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

ARG ADMIN_USERNAME
ARG ADMIN_PASSWORD

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

COPY google95b836b3564f0edc.html ./public/

# Build the app
ENV NEXT_PUBLIC_API_URL=https://api.dawooddilawar.com
ENV ADMIN_USERNAME=${ADMIN_USERNAME}
ENV ADMIN_PASSWORD=${ADMIN_PASSWORD}
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]