import express from 'express';
import { startProxyCheckStream, receiveProxies } from '../controllers/proxyChecker.js';
import { getData, changeIp } from '../controllers/proxyManager.js';
import { getHomePage, postCreateUser, getCreatePage, getUpdatePage } from '../controllers/home.js';

const router = express.Router();

router.get('/', getHomePage);
router.get('/create', getCreatePage);
router.get('/update', getUpdatePage);
router.get('/proxy/check-stream', startProxyCheckStream);

router.post('/create-user', postCreateUser);
router.post('/getData', getData);
router.post('/proxy/send-proxies', receiveProxies);
router.post('/proxy/change-ip', changeIp);

export default router;
