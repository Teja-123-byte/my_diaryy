const cors = require('cors');

const ORIGINS = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://my-diaryyy.vercel.app'
];

const corsOptions = {
  origin: ORIGINS,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
};

const ioCorOptions = {
  origin: [...ORIGINS, '*'],
  methods: ['GET', 'POST'],
  credentials: true,
};

module.exports = { corsOptions, ioCorOptions, ORIGINS };
