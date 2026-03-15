const fastify = require('fastify')({ logger: true })
const axios = require('axios');

// 1. Register CORS first!
fastify.register(require('@fastify/cors'), { 
  origin: "*",
  methods: ["POST", "GET", "OPTIONS"]
})

// 2. Health check route
fastify.get('/', async () => {
  return { status: 'Gateway is active' }
})

// Add this to handle "Memorizing" things
fastify.post('/ingest', async (request, reply) => {
  try {
    const { content } = request.body
    
    // Note: We use 8001 here because we moved Python to 8001!
    const aiResponse = await axios.post('http://localhost:8001/ingest', {
      content: content
    });
    
    return { status: "Success", message: "Gateway passed data to AI Service" }
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "Could not reach AI Service for ingestion" });
  }
})

// 3. The Chat route
fastify.post('/chat', async (request, reply) => {
  try {
    const { message } = request.body
    
    // This calls your Python service on port 8000
    const aiResponse = await axios.post('http://localhost:8001/generate', {
      message: message
    });
    
    return { response: aiResponse.data.response }
  } catch (error) {
    fastify.log.error(error);
    return reply.status(500).send({ error: "AI Service is unreachable" });
  }
})

const start = async () => {
  try {
    // Port 3000 is where your React app is looking
    await fastify.listen({ port: 3005, host: '0.0.0.0' })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()