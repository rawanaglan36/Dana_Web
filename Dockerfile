FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port for serving
EXPOSE 5173

# Serve the built files using a simple static server
RUN npm install -g serve

CMD ["serve", "-s", "dist", "-l", "5173"]
