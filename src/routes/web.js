import express from 'express'
import {
  startProxyCheckStream,
  receiveProxies,
} from '../controllers/proxyChecker.js'
import {
  getData,
  getAPIKey,
  changeIp,
  reinstall,
  changeNote,
  pause,
  reboot,
  refund,
  refundCalc,
  renew,
  checkPair,
  getTextEn,
  buyProxy,
  buyCalc,
} from '../controllers/proxyManager.js'
import {
  getHomePage,
  postCreateUser,
  getCreatePage,
  getUpdatePage,
} from '../controllers/home.js'

import { saveTodb, getFromDb } from '../controllers/data.controller.js'

const router = express.Router()

router.get('/', getHomePage)
router.get('/create', getCreatePage)
router.get('/update', getUpdatePage)
router.get('/proxy/check-stream', startProxyCheckStream)

router.post('/create-user', postCreateUser)
router.post('/get-api-key', getAPIKey)
router.post('/check-pair', checkPair)
router.post('/get-text-en', getTextEn)
router.post('/getData', getData)
router.post('/proxy/send-proxies', receiveProxies)

router.post('/proxy/change-note', changeNote)
router.post('/proxy/pause', pause)
router.post('/proxy/reboot', reboot)
router.post('/proxy/refund', refund)
router.post('/proxy/refund-calc', refundCalc)
router.post('/proxy/renew', renew)
router.post('/proxy/change-ip', changeIp)
router.post('/proxy/reinstall', reinstall)
router.post('/proxy/buy-proxy', buyProxy)
router.post('/proxy/buy-calc', buyCalc)
router.post('/proxy/get-from-db', getFromDb)

router.put('/proxy/sync-to-db', saveTodb)

export default router
