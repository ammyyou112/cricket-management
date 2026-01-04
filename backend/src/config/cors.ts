import cors from 'cors';

const allowedOrigins = [
  'http://localhost:5173',  // Vite default
  'http://localhost:8080',  // Current frontend port
  'http://localhost:3000',  // Backend port
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
].filter(Boolean) as string[];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      console.log('✅ Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 600, // 10 minutes
};

export default corsOptions;
