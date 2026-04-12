const fastify = require('fastify')({ 
    logger: true,
    connectionTimeout: 190000 
});
const axios = require('axios');
const FormData = require('form-data');
const { google } = require('googleapis'); // NEW: npm install googleapis

// 1. Register CORS & Multipart (Preserved)
fastify.register(require('@fastify/cors'), { 
    origin: "*",
    methods: ["POST", "GET", "OPTIONS"]
});

fastify.register(require('@fastify/multipart'), {
    limits: { fileSize: 50 * 1024 * 1024 }
});

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://ai-service:8001";

// --- NEW: Google OAuth Client Setup ---
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// --- NEW: Auth Routes (Fixes your 404 error) ---
fastify.get('/auth/google', async (request, reply) => {
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/calendar.readonly']
    });
    return reply.redirect(url);
});

fastify.get('/auth/google/callback', async (request, reply) => {
    const { code } = request.query;
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Redirect back to the frontend temporal page
    return reply.redirect('http://localhost:5173/temporal'); 
});

// 2. Updated Tasks Route (Fetches real Calendar data)
fastify.get('/tasks', async (request, reply) => {
    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const events = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });

        // Map events to match your Task interface
        const tasks = events.data.items.map(event => ({
            task: event.summary,
            time: new Date(event.start.dateTime || event.start.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'pending'
        }));

        return { tasks };
    } catch (error) {
        fastify.log.error("Calendar fetch failed:", error);
        return { tasks: [] };
    }
});

// 3. Ingest Route (Preserved Exactly)
fastify.post('/ingest', async (request, reply) => {
    try {
        const data = await request.file();
        if (!data) return reply.status(400).send({ error: "No file provided" });
        const form = new FormData();
        form.append('file', data.file, { filename: data.filename, contentType: data.mimetype });
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/ingest`, form, {
            headers: { ...form.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });
        return { status: "Success", detail: aiResponse.data };
    } catch (error) {
        return reply.status(500).send({ error: "Ingestion Failed", message: error.message });
    }
});

// 4. Chat Route (Updated to inject context)
fastify.post('/chat', async (request, reply) => {
    try {
        const { message } = request.body;
        let calContext = "";

        try {
            const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
            const events = await calendar.events.list({ calendarId: 'primary', timeMin: new Date().toISOString(), maxResults: 3 });
            calContext = events.data.items.map(e => `${e.summary} at ${e.start.dateTime}`).join(", ");
        } catch (e) { /* context unavailable */ }

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/generate`, {
            message: `${message} (Schedule Context: ${calContext || 'None'})`
        });
        return { response: aiResponse.data.response };
    } catch (error) {
        return reply.status(500).send({ error: "AI Service unreachable" });
    }
});

const start = async () => {
    try {
        await fastify.listen({ port: 3005, host: '0.0.0.0' });
    } catch (err) {
        process.exit(1);
    }
};
start();