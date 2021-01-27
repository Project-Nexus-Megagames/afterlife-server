const express = require('express'); // Import of Express web framework
const router = express.Router(); // Destructure of HTTP router for server
const nexusEvent = require('../../middleware/events/events'); // Local event triggers

const validateObjectId = require('../../middleware/util/validateObjectId');
const { logger } = require('../../middleware/log/winston'); // Import of winston for error/info logging

// Agent Model - Using Mongoose Model
const { Action } = require('../../models/action'); // Agent Model
const httpErrorHandler = require('../../middleware/util/httpError');
const nexusError = require('../../middleware/util/throwError');
const { Asset } = require('../../models/asset');
const { Character } = require('../../models/character');

// @route   GET api/actions
// @Desc    Get all actions
// @access  Public
router.get('/', async function(req, res) {
	logger.info('GET Route: api/action requested...');
	try {
		const agents = await Action.find().populate('creator');
		res.status(200).json(agents);
	}
	catch (err) {
		logger.error(err.message, { meta: err.stack });
		res.status(500).send(err.message);
	}
});

// @route   GET api/actions/:id
// @Desc    Get a single Action by ID
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
	logger.info('GET Route: api/action/:id requested...');
	const id = req.params.id;
	try {
		const action = await Action.findById(id);
		if (action != null) {
			res.status(200).json(action);
		}
		else {
			nexusError(`The Action with the ID ${id} was not found!`, 404);
		}
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});

// @route   POST api/actions
// @Desc    Post a new action
// @access  Public
router.post('/', async function(req, res) {
	logger.info('POST Route: api/action call made...');
	const { data } = req.body;
	try {
		let newElement = new Action(data);
		const docs = await Action.find({ intent: data.intent });

		if (docs.length < 1) {
			if (data.asset1) {
				const ass = await Asset.findOne({ name: data.asset1 });
				ass.status.used = true;
				await ass.save();
			}
			if (data.asset2) {
				const ass = await Asset.findOne({ name: data.asset2 });
				ass.status.used = true;
				await ass.save();
			}
			if (data.asset3) {
				const ass = await Asset.findOne({ name: data.asset3 });
				ass.status.used = true;
				await ass.save();
			}

			const character = await Character.findById(data.creator);
			character.effort = character.effort - data.effort;
			if (character.effort > 3) character.effort = 3;
			await character.save();

			newElement = await newElement.save();
			logger.info(`${newElement.intent} created.`);
			nexusEvent.emit('updateCharacters');
			nexusEvent.emit('updateAssets');
			nexusEvent.emit('updateActions');
			res.status(200).json(newElement);
		}
		else {
			nexusError(`An action with intent ${newElement.intent} already exists!`, 400);
		}
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});

// @route   DELETE api/actions/:id
// @Desc    Delete an action
// @access  Public
router.delete('/:id', async function(req, res) {
	logger.info('DEL Route: api/agent:id call made...');
	try {
		const id = req.params.id;
		let element = await Action.findById(id);
		if (element != null) {
			element = await Action.findByIdAndDelete(id);
			if (element.asset1) {
				const ass = await Asset.findOne({ name: element.asset1 });
				ass.status.used = false;
				await ass.save();
			}
			if (element.asset2) {
				const ass = await Asset.findOne({ name: element.asset2 });
				ass.status.used = false;
				await ass.save();
			}
			if (element.asset3) {
				const ass = await Asset.findOne({ name: element.asset3 });
				ass.status.used = false;
				await ass.save();
			}

			const character = await Character.findById(element.creator);
			character.effort = character.effort + element.effort;
			await character.save();

			logger.info(`Action with the id ${id} was deleted!`);
			nexusEvent.emit('updateCharacters');
			nexusEvent.emit('updateActions');
			nexusEvent.emit('updateAssets');
			res.status(200).send(`Action with the id ${id} was deleted!`);
		}
		else {
			nexusError(`No action with the id ${id} exists!`, 400);
		}
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});

// @route   PATCH api/actions/deleteAll
// @desc    Delete All actions
// @access  Public
router.patch('/deleteAll', async function(req, res) {
	let delCount = 0;
	for await (const element of Action.find()) {
		const id = element.id;
		try {
			const elementDel = await Action.findByIdAndRemove(id);
			if (elementDel == null) {
				res.status(404).send(`The Action with the ID ${id} was not found!`);
			}
			else {
				delCount += 1;
			}
		}
		catch (err) {
			nexusError(`${err.message}`, 500);
		}
	}
	nexusEvent.emit('updateActions');
	return res.status(200).send(`We wiped out ${delCount} Actions`);
});

// ~~~Game Routes~~~
router.patch('/editAction', async function(req, res) {
	logger.info('POST Route: api/action call made...');
	const { id, description, intent, effort, asset1, asset2, asset3 } = req.body.data;
	try {
		const docs = await Action.findById(id);

		if (docs === null) {
			nexusError('Could not find the action desired, please contact Tech Control', 400);
		}
		else {
			docs.description = description;
			docs.intent = intent;

			const character = await Character.findById(docs.creator);
			character.effort = character.effort - (effort - docs.effort);
			await character.save();

			docs.effort = effort;

			if (docs.asset1) {
				const ass = await Asset.findOne({ name: docs.asset1 });
				ass.status.used = false;
				await ass.save();
			}
			if (docs.asset2) {
				const ass = await Asset.findOne({ name: docs.asset2 });
				ass.status.used = false;
				await ass.save();
			}
			if (docs.asset3) {
				const ass = await Asset.findOne({ name: docs.asset3 });
				ass.status.used = false;
				await ass.save();
			}

			asset1 === undefined ? docs.asset1 = '' : docs.asset1 = asset1;
			asset2 === undefined ? docs.asset2 = '' : docs.asset2 = asset2;
			asset3 === undefined ? docs.asset3 = '' : docs.asset3 = asset3;

			if (docs.asset1) {
				const ass = await Asset.findOne({ name: docs.asset1 });
				ass.status.used = true;
				await ass.save();
			}
			if (docs.asset2) {
				const ass = await Asset.findOne({ name: docs.asset2 });
				ass.status.used = true;
				await ass.save();
			}
			if (docs.asset3) {
				const ass = await Asset.findOne({ name: docs.asset3 });
				ass.status.used = true;
				await ass.save();
			}

			await docs.save();
			nexusEvent.emit('updateCharacters');
			nexusEvent.emit('updateActions');
			nexusEvent.emit('updateAssets');
			res.status(200).json(docs);
		}
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});

router.patch('/editResult', async function(req, res) {
	logger.info('POST Route: api/action/editResult call made...');
	const { id, result, status, dieResult } = req.body.data;
	try {
		const docs = await Action.findById(id);

		if (docs === null) {
			nexusError('Could not find the action desired, please contact Tech Control', 400);
		}
		else {
			docs.result = result;
			docs.dieResult = dieResult;
			if (status) {
				docs.status.draft = false;
				docs.status.ready = false;
				docs.status.published = false;
				switch (status) {
				case 'draft':
					docs.status.draft = true;
					break;
				case 'ready':
					docs.status.ready = true;
					break;
				case 'published':
					docs.status.published = true;
					break;
				default:
					break;
				}
			}

			await docs.save();
			nexusEvent.emit('updateActions');
			res.status(200).send('Action result successfully edited');
		}
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});

router.post('/project', async function(req, res) {
	logger.info('POST Route: api/action/project call made...');
	const { data } = req.body;
	try {
		let newElement = new Action(data);
		newElement = await newElement.save();
		res.status(200).json(newElement);
		nexusEvent.emit('updateActions');
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});

router.patch('/project', async function(req, res) {
	logger.info('patch Route: api/action/project call made...');
	const { description, intent, progress, players, image, id } = req.body.data;
	try {
		const project = await Action.findById(id);
		project.description = description;
		project.intent = intent;
		project.progress = progress;
		project.players = players;
		project.image = image;
		await project.save();

		nexusEvent.emit('updateActions');
		res.status(200).json(project);
	}
	catch (err) {
		httpErrorHandler(res, err);
	}
});


module.exports = router;
