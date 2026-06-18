# backend-api/Dockerfile
FROM node:18-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production || npm install --production

# Copy Prisma schema FIRST (for Prisma generate)
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]