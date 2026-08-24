FROM node:20-alpine

WORKDIR /app

# NEXT_PUBLIC_* is inlined at build time, so it must be a browser-reachable URL.
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
