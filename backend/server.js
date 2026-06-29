import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { runDebate } from './orchestrator.js';
import { 
  getAllDebates, 
  getDebateById, 
  insertUser, 
  getUserByEmail, 
  getUserById, 
  getDebatesCountToday, 
  insertTranslation, 
  getTranslation,
  getDatabaseMetrics
} from './db.js';
import { authMiddleware, verifyToken } from './authMiddleware.js';
import { getCompletion } from './claudeClient.js';
import { logger } from './logger.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'jwt_default_secret_for_silicon_debate';

// 1. Helmet Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable in development to avoid blocking WebSockets/Vite asset loading
  crossOriginEmbedderPolicy: false
}));

// 2. CORS and Body Parsers
app.use(cors());
app.use(express.json());

// 3. Winston Request Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit signup/login requests to 20 per hour per IP
  message: { error: 'Too many authentication attempts, please try again in an hour.' }
});

// 5. Input Validation Schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(6, 'Password must be at least 6 characters.')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address format.'),
  password: z.string().min(1, 'Password is required.')
});

const translateSchema = z.object({
  debate_id: z.string().min(1, 'Debate ID is required.'),
  target_language: z.string().min(2, 'Target language is required.')
});

// Basic XSS escaping utility
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ==========================================
// REST API ROUTES
// ==========================================

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// User Signup
app.post('/api/auth/signup', authLimiter, async (req, res, next) => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = getUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = crypto.randomUUID();

    insertUser({
      id: userId,
      email: normalizedEmail,
      password_hash: passwordHash,
      created_at: new Date().toISOString()
    });

    const token = jwt.sign({ id: userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });
    logger.info(`User signed up successfully: ${normalizedEmail}`, { userId });
    
    res.status(201).json({ token, user: { id: userId, email: normalizedEmail } });
  } catch (err) {
    next(err);
  }
});

// User Login
app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = getUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });
    logger.info(`User logged in successfully: ${normalizedEmail}`, { userId: user.id });

    res.json({ token, user: { id: user.id, email: normalizedEmail } });
  } catch (err) {
    next(err);
  }
});

// Retrieve logged in user context
app.get('/api/auth/me', authLimiter, authMiddleware, async (req, res, next) => {
  try {
    const user = getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User session not found.' });
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// Retrieve all debates (most recent first, user-scoped)
app.get('/api/debates', apiLimiter, authMiddleware, (req, res, next) => {
  try {
    const debates = getAllDebates(req.user.id);
    res.json(debates);
  } catch (err) {
    next(err);
  }
});

// Retrieve a single debate by ID
app.get('/api/debates/:id', apiLimiter, authMiddleware, (req, res, next) => {
  try {
    const debate = getDebateById(req.params.id);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found' });
    }
    // Auth scoping check
    if (debate.user_id && debate.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: this debate does not belong to your account.' });
    }

    res.json({
      id: debate.id,
      topic: debate.topic,
      transcript: JSON.parse(debate.transcript),
      verdict: JSON.parse(debate.verdict),
      created_at: debate.created_at,
      language: debate.language
    });
  } catch (err) {
    next(err);
  }
});

// Translate debate on-demand using Claude
app.post('/api/translate', apiLimiter, authMiddleware, async (req, res, next) => {
  try {
    const parseResult = translateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors[0].message });
    }

    const { debate_id, target_language } = parseResult.data;

    // Check DB translations cache
    const cachedTranslation = getTranslation(debate_id, target_language);
    if (cachedTranslation) {
      logger.info(`Translation cache hit for debate ${debate_id} in ${target_language}`);
      return res.json({
        debate_id,
        target_language,
        transcript: JSON.parse(cachedTranslation.translated_transcript),
        verdict: JSON.parse(cachedTranslation.translated_verdict)
      });
    }

    // Retrieve original debate
    const debate = getDebateById(debate_id);
    if (!debate) {
      return res.status(404).json({ error: 'Debate not found.' });
    }
    if (debate.user_id && debate.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const originalTranscript = JSON.parse(debate.transcript);
    const originalVerdict = JSON.parse(debate.verdict);

    logger.info(`Translation cache miss for debate ${debate_id} in ${target_language}. Calling Claude API...`);

    const systemPrompt = `You are a professional translator. You must translate the given debate text into the target language: "${target_language}".
CONSTRAINTS:
1. Translate ONLY. Do not rewrite, improve, summarize, or change the meaning, tone, or scoring of the debate.
2. You must respond with a SINGLE valid JSON object matching the exact structure below, containing the translated fields.
3. Do not include markdown blocks (like \`\`\`json) or any extra conversational text.

JSON Structure:
{
  "transcript": [
    { "speaker": "A", "round": 1, "text": "translated text here" },
    { "speaker": "B", "round": 1, "text": "translated text here" },
    ...
  ],
  "verdict_reasoning": "translated reasoning here"
}`;

    const promptMessage = [
      {
        role: 'user',
        content: JSON.stringify({
          transcript: originalTranscript,
          verdict_reasoning: originalVerdict.reasoning
        })
      }
    ];

    let claudeResponse;
    try {
      const rawRes = await getCompletion(systemPrompt, promptMessage);
      let cleanRes = rawRes.trim();
      if (cleanRes.startsWith('```')) {
        cleanRes = cleanRes.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
      }
      claudeResponse = JSON.parse(cleanRes);
    } catch (apiErr) {
      logger.error('Claude API translation execution failed:', apiErr);
      return res.status(502).json({ error: 'Claude translation service failed. Please try again.' });
    }

    if (!claudeResponse.transcript || !claudeResponse.verdict_reasoning) {
      throw new Error('Claude returned an invalid translation JSON format.');
    }

    const translatedTranscript = claudeResponse.transcript;
    const translatedVerdict = {
      ...originalVerdict,
      reasoning: claudeResponse.verdict_reasoning
    };

    // Cache to DB translations table
    insertTranslation({
      debate_id,
      target_language,
      translated_transcript: JSON.stringify(translatedTranscript),
      translated_verdict: JSON.stringify(translatedVerdict)
    });

    res.json({
      debate_id,
      target_language,
      transcript: translatedTranscript,
      verdict: translatedVerdict
    });
  } catch (err) {
    next(err);
  }
});

// Admin-style Metrics API
app.get('/api/metrics', apiLimiter, (req, res, next) => {
  try {
    const dbMetrics = getDatabaseMetrics();
    res.json({
      ...dbMetrics,
      error_count: global.errorCounter || 0
    });
  } catch (err) {
    next(err);
  }
});

// Health metrics logger error counter initialization
global.errorCounter = 0;

// Centralized Error-Handling Middleware
app.use((err, req, res, next) => {
  global.errorCounter++;
  logger.error(`Server error: ${err.message}`, { stack: err.stack, path: req.path });
  
  res.status(err.status || 500).json({
    error: 'An internal server error occurred.'
  });
});

const server = http.createServer(app);

// Initialize WebSocket server with noServer so we can handle path-based upgrades
const wss = new WebSocketServer({ noServer: true });

// Handle upgrade requests with JWT validation
server.on('upgrade', (request, socket, head) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (url.pathname === '/debate') {
      const token = url.searchParams.get('token');
      if (!token) {
        logger.warn('[Upgrade Rejected] Connection upgrade request missing JWT token query.');
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }
      
      try {
        const decoded = verifyToken(token);
        request.user = decoded; // Attach user payload to request
      } catch (tokenErr) {
        logger.warn('[Upgrade Rejected] Invalid JWT token upgrade request:', tokenErr.message);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  } catch (err) {
    logger.error('[Upgrade ExceptionError]', err);
    socket.destroy();
  }
});

wss.on('connection', (ws, request) => {
  const user = request.user;
  logger.info('[WebSocket] Connection opened for user:', { userId: user.id });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { topic } = data;

      // Escaping & XSS Sanitization
      const cleanTopic = sanitizeInput(topic);

      // Validate topic length via Zod
      const topicSchema = z.string().min(3, 'Debate topic must be at least 3 characters.').max(150, 'Debate topic is too long.');
      const validation = topicSchema.safeParse(cleanTopic);
      
      if (!validation.success) {
        ws.send(JSON.stringify({
          type: 'error',
          message: validation.error.errors[0].message
        }));
        ws.close();
        return;
      }

      // Check daily rate limit: 5 debates per day per user
      const todayCount = getDebatesCountToday(user.id);
      if (todayCount >= 5) {
        logger.warn(`[WebSocket RateLimit] User ${user.id} has hit the daily limit of 5 debates.`);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Daily debate limit reached, try again tomorrow'
        }));
        ws.close();
        return;
      }

      // Run debate orchestration
      await runDebate(validation.data, ws, user.id);

    } catch (err) {
      logger.error('[WebSocket Message ExceptionError]', err);
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Malformed message or internal debate failure.'
        }));
        ws.close();
      }
    }
  });

  ws.on('close', () => {
    logger.info('[WebSocket] Connection closed for user:', { userId: user.id });
  });
});

server.listen(port, () => {
  logger.info(`[Server] Express + WS server listening on http://localhost:${port}`);
});

