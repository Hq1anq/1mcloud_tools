import express from 'express';
import { startProxyCheckStream, receiveProxies } from '../controllers/proxyChecker.js';
import getData from '../controllers/getData.js';
import { getDataFromIP } from '../controllers/proxyManager.js';
import { getHomePage, postCreateUser, getCreatePage, getUpdatePage } from '../controllers/home.js';

const router = express.Router();

router.get('/', getHomePage);
router.get('/server/list', getData);
router.get('/create', getCreatePage);
router.get('/update', getUpdatePage);
router.get('/proxy/check-stream', startProxyCheckStream);

router.post('/create-user', postCreateUser);
router.post('/get-data-from-ip', getDataFromIP);
router.post('/proxy/send-proxies', receiveProxies);

export default router;
