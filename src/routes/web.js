import express from 'express';
import checkProxy from '../controllers/checkProxy.js';
import getData from '../controllers/getData.js';
import { postCreateUser } from '../controllers/home.js';

const router = express.Router();

router.post('/create-user', postCreateUser);
router.post('/proxy/check', checkProxy);
router.get('/server/list', getData);

export default router;
