const express = require('express'); // Import of Express web framework
const router = express.Router(); // Destructure of HTTP router for server
const { logger } = require('../../middleware/log/winston'); // Import of winston for error/info logging
// Agent Model - Using Mongoose Model

const httpErrorHandler = require('../../middleware/util/httpError');
const nexusError = require('../../middleware/util/throwError');
const { GameConfig } = require('../../models/gameConfig');


// @route   GET api/gameConfig
// @Desc    Get gameConfig
// @access  Public
router.get('/', async function(req, res, next) {
	logger.info('GET Route: api/gameConfig requested: get all');
	if (req.timedout) {
		next();
	}
	else {
		try {
			const config = await GameConfig.find({});
			res.status(200).json(config);
		}
		catch (err) {
			logger.error(err.message, { meta: err.stack });
			res.status(500).send(err.message);
		}
	}
});


// @route   POST api/gameConfig
// @Desc    Post a new comment
// @access  Public
router.post('/', async function(req, res, next) {
	logger.info('POST Route: api/gameConfig call made...');
	if (req.timedout) {
		next();
	}
	else {
		try {
			const docs = await GameConfig.find();
			if (docs.length < 1) {
				const config = await GameConfig.find();
				logger.info('GameConfig  created.');
				res.status(200).json(config);
			}
			else {
				nexusError('GameConfig already exists!', 400);
			}
		}
		catch (err) {
			httpErrorHandler(res, err);
		}
	}
});


// @route   PATCH api/comments/deleteAll
// @desc    Delete All comments
// @access  Public

router.patch('/delete', async function(req, res) {
	const data = await GameConfig.deleteMany();
	return res.status(200).send(`We wiped out ${data.deletedCount} Configurations!`);
});

module.exports = router;
