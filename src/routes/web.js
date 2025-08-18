import express from 'express';
import { startProxyCheckStream, receiveProxies } from '../controllers/proxyChecker.js';
import { getData, changeIp, reinstall, changeNote, pause, reboot } from '../controllers/proxyManager.js';

const router = express.Router();

router.get('/proxy/check-stream', startProxyCheckStream);
router.post('/proxy/send-proxies', receiveProxies);

router.post('/getData', getData);
router.post('/proxy/change-note', changeNote);
router.post('/proxy/pause', pause);
router.post('/proxy/reboot', reboot);
router.post('/proxy/change-ip', changeIp);
router.post('/proxy/reinstall', reinstall);

export default router;
