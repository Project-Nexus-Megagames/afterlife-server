const mongoose = require('mongoose'); // Mongo DB object modeling module
// const Joi = require('joi'); // Schema description & validation module
// const nexusError = require('../middleware/util/throwError'); // Costom error handler util

// Global Constants
const Schema = mongoose.Schema; // Destructure of Schema
const ObjectId = mongoose.ObjectId; // Destructure of Object ID

const ActionSchema = new Schema({
	model:  { type: String, default: 'Action' },
	players: [{ type: ObjectId, ref: 'Player' }],
	approach:  { type: String, default: 'Masks' }, // Update this when docs come
	traits: [{ type: Schema.Types.Mixed }], // change to trait ID
	assets: [{ type: Schema.Types.Mixed }], // change to asset ID
	round: { type: Number },
	description: { type: String, required: true },
	intent: { type: String, required: true },
	effort: { type: Number, required: true },
	status: {
		draft: { type: Boolean, default: true },
		ready: { type: Boolean, default: false },
		published: { type: Boolean, default: false },
		progress: { type: Number, default: 0 }
	},
	dieResult: { type: Number, default: 0 },
	result: { type: String }
});

const Action = mongoose.model('Action', ActionSchema);

module.exports = { Action };