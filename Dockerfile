# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Set to false to call the real services through the API Gateway.
ARG VITE_USE_MOCK_API=true
ENV VITE_USE_MOCK_API=$VITE_USE_MOCK_API
RUN npm run build

# Runtime stage: static files served by nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
