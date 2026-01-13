/**
 * Routes for display and text operations
 */

const express = require('express');
const router = express.Router();
const { sayController } = require('../controllers/displayControllers');

router.post('/say', sayController);

module.exports = router;
