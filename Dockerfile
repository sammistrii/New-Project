# Multi-stage build for Node.js application
FROM node:18-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    ffmpeg \
    && rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Development stage
FROM base AS development

# Install dev dependencies
RUN npm ci

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p logs uploads

# Build frontend if it exists
RUN if [ -f "frontend/package.json" ]; then \
        cd frontend && npm ci && npm run build && cd ..; \
    fi

# Set environment variables
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]