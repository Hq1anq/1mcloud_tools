import express from 'express';
import checkProxy from '../controllers/checkProxy.js';
import getData from '../controllers/getData.js';
import { getHomePage, postCreateUser, getCreatePage } from '../controllers/home.js';

const router = express.Router();

router.get('/', getHomePage);
router.get('/server/list', getData);
router.get('/create', getCreatePage);

router.post('/create-user', postCreateUser);
router.post('/proxy/check', checkProxy);

export default router;
