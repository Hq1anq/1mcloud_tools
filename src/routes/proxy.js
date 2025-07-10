import express from 'express';
import checkProxy from '../controllers/checkProxy.js';

const router = express.Router();

router.post('/proxy/check', checkProxy);

export default router;
