const fastify = require('fastify')({ 
    logger: true,
    connectionTimeout: 190000 
});
const axios = require('axios');
const FormData = require('form-data'); // You may need to: npm install form-data

// 1. Register CORS
fastify.register(require('@fastify/cors'), { 
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"]
});

// 2. NEW: Register Multipart Support (Fixes 415 error)
fastify.register(require('@fastify/multipart'), {
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8001";

// 3. Health Check
fastify.get('/', async () => {
    return { 
        status: 'Gateway is active',
        connected_to: AI_SERVICE_URL 
    };
});

// 4. Updated Ingest Route (Handles Files)
fastify.post('/ingest', async (request, reply) => {
    try {
        // Capture the multipart file stream
        const data = await request.file();
        
        if (!data) {
            return reply.status(400).send({ error: "No file provided" });
        }

        // Create a new FormData object to send to Python AI Service
        const form = new FormData();
        // data.file is the actual readable stream
        form.append('file', data.file, {
            filename: data.filename,
            contentType: data.mimetype,
        });

        // Forward the file to your Python FastAPI service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ingest`, form, {
            headers: {
                ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        
        return { 
            status: "Success", 
            message: `Vectorized: ${data.filename}`,
            detail: aiResponse.data 
        };

    } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({ 
            error: "Ingestion Pipeline Failed",
            message: error.message 
        });
    }
});

// 5. Chat Route (Unchanged but verified)
fastify.post('/chat', async (request, reply) => {
    try {
        const { message } = request.body;
        
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
            message: message
        });
        
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
        await fastify.listen({ port: 3005, host: '0.0.0.0' });
        console.log("Gateway listening on port 3005 with Multipart support");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();