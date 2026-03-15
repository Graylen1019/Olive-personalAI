const fastify = require('fastify')({ 
    logger: true,
    connectionTimeout: 30000 // Give the AI some time to think
});
const axios = require('axios');

// 1. Register CORS - This is vital for the React frontend to talk to this API
fastify.register(require('@fastify/cors'), { 
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"]
});

// 2. Define the AI Service URL
// Inside Docker, it uses the service name 'ai-service'
// Outside Docker (local dev), it falls back to 'localhost'
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8001";

// 3. Health Check
fastify.get('/', async () => {
    return { 
        status: 'Gateway is active',
        connected_to: AI_SERVICE_URL 
    };
});

// 4. Ingest Route (Memory)
fastify.post('/ingest', async (request, reply) => {
    try {
        const { content } = request.body;
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ingest`, {
            content: content
        });
        
        return { 
            status: "Success", 
            message: "Data passed to AI Service",
            detail: aiResponse.data 
        };
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
            error: "AI Service (Ingest) is unreachable",
            message: error.message 
        });
    }
});

// 5. Chat Route (Generation)
fastify.post('/chat', async (request, reply) => {
    try {
        const { message } = request.body;
        
        // This calls the Python FastAPI service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
            message: message
        });
        
        // Return the final response to your React app
        return { response: aiResponse.data.response };
    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
            error: "AI Service (Generate) is unreachable",
            message: error.message 
        });
    }
});

// 6. Start the Server
const start = async () => {
    try {
        // Listening on 0.0.0.0 is required for Docker to expose the port
        await fastify.listen({ port: 3005, host: '0.0.0.0' });
        console.log("Gateway listening on port 3005");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();