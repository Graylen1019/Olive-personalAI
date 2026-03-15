# 1. Use a pre-made "box" that already has Node.js installed
FROM node:20

# 2. Create a folder inside the container for our code
WORKDIR /app

# 3. Copy the 'shopping list' of libraries and install them
COPY package*.json ./
RUN npm install

# 4. Copy all your server code into the container
COPY . .

# 5. Tell the container to start the server when it wakes up
CMD ["node", "server.js"]