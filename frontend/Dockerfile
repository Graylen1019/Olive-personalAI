# Use a Node image to build and run the app
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Vite's default port is 5173
EXPOSE 5173

# We add --host 0.0.0.0 so Vite listens to external requests from Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]