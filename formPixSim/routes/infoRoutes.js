/**
 * Routes for system information
 */

const express = require('express');
const router = express.Router();
const { getInfoController } = require('../controllers/infoControllers');

router.get('/info', getInfoController);

module.exports = router;
