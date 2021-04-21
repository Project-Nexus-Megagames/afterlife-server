const mongoose = require('mongoose'); // Mongo DB object modeling module
// const Joi = require('joi'); // Schema description & validation module
// const nexusError = require('../middleware/util/throwError'); // Costom error handler util

// Global Constants
const Schema = mongoose.Schema; // Destructure of Schema
// const ObjectId = mongoose.ObjectId; // Destructure of Object ID

const AssetSchema = new Schema({
	model:  { type: String, default: 'Asset', enum: ['Asset', 'Trait', 'Wealth', 'Bond'] },
	name: { type: String, required: true },
	description: { type: String, required: true },
	status: {
		hidden: { type: Boolean, default: false },
		lent: { type: Boolean, default: false },
		multiUse: { type: Boolean, default: false },
		used: { type: Boolean, default: false }
	},
	currentHolder: { type: String },
	uses: { type: Number, default: 999 }
});

const Asset = mongoose.model('Asset', AssetSchema);

module.exports = { Asset };