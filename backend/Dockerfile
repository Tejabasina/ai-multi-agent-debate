FROM node:20-alpine

# Set directory
WORKDIR /usr/src/app

# Install better-sqlite3 compilation tools
RUN apk add --no-cache python3 make g++

# Copy dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose express/websocket port
EXPOSE 5000

# Run server
CMD ["npm", "start"]
