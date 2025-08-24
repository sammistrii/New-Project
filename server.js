import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Enhanced CORS for better compatibility
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Optimize static file serving for Render
app.use(express.static(__dirname, {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else if (path.endsWith('.js')) {
            res.setHeader('Cache-Control', 'public, max-age=3600');
        } else if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'public, max-age=300');
        }
    }
}));

// Health check endpoint with enhanced status
app.get('/api/health', (req, res) => {
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasGemini = !!process.env.GEMINI_API_KEY;
    const uptime = process.uptime();
    const isFreshStart = uptime < 120; // Less than 2 minutes
    
    res.json({
        ok: true,
        status: isFreshStart ? 'waking_up' : 'fully_awake',
        hasOpenAI,
        hasGemini,
        uptime: uptime,
        isFreshStart: isFreshStart,
        message: isFreshStart ? 'Server just woke up from sleep mode' : 'Server is fully operational',
        timestamp: new Date().toISOString(),
        debug: {
            geminiKeyExists: !!process.env.GEMINI_API_KEY,
            geminiKeyLength: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0,
            geminiKeyPreview: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) + '...' : 'none'
        }
    });
});

// AI Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { provider, model, messages, max_tokens, temperature } = req.body;
        
        if (!provider || !messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request parameters' });
        }

        let response;
        
        if (provider === 'openai') {
            if (!process.env.OPENAI_API_KEY) {
                return res.status(500).json({ error: 'OpenAI API key not configured' });
            }
            
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            
            response = await openai.chat.completions.create({
                model: model || 'gpt-3.5-turbo',
                messages,
                max_tokens: max_tokens || 1000,
                temperature: temperature || 0.7,
            });
            
            res.json({ response: response.choices[0].message.content });
            
        } else if (provider === 'gemini') {
            console.log('Gemini API called');
            console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
            console.log('GEMINI_API_KEY length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0);
            
            if (!process.env.GEMINI_API_KEY) {
                console.log('Gemini API key missing');
                return res.status(500).json({ error: 'Gemini API key not configured' });
            }
            
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });
                
                console.log('Calling Gemini API...');
                const result = await geminiModel.generateContent(messages[messages.length - 1].content);
                const geminiResponse = await result.response;
                
                console.log('Gemini API response received');
                res.json({ response: geminiResponse.text() });
            } catch (geminiError) {
                console.error('Gemini API call failed:', geminiError);
                throw geminiError;
            }
            
        } else {
            res.status(400).json({ error: 'Invalid provider. Use "openai" or "gemini"' });
        }
        
    } catch (error) {
        console.error('AI API Error:', error);
        
        // Better error handling for Render
        if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
            res.status(503).json({ 
                error: 'Service temporarily unavailable. Please try again in a moment.',
                details: 'The AI service is starting up. This is normal on Render free tier.'
            });
        } else {
            res.status(500).json({ 
                error: 'AI service error',
                details: error.message || 'Unknown error occurred'
            });
        }
    }
});

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Enhanced error handling
app.use((error, req, res, next) => {
    console.error('Server Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: 'Something went wrong. Please try again.'
    });
});

app.listen(PORT, () => {
    console.log(`MindMate server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
});


