import express from 'express';
import getData from '../controllers/getData.js';

const router = express.Router();

// Proxy endpoint for /api/server/list
router.get('/server/list', getData);

export default router;
