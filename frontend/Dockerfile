# Use a Node image to build and run the app
FROM node:22-alpine

# Set the working directory
WORKDIR /app

# Copy package files first (helps with caching so 'npm install' is faster)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of your frontend code
COPY . .

# Expose the port React runs on
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]