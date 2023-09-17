const mongoose = require('mongoose'); // Mongo DB object modeling module
const { clearArrayValue, addArrayValue } = require('../middleware/util/arrayCalls');
// const Joi = require('joi'); // Schema description & validation module
const nexusEvent = require('../middleware/events/events');

// Global Constants
const Schema = mongoose.Schema; // Destructure of Schema
const ObjectId = mongoose.ObjectId; // Destructure of Object ID

const DiceSchema = new Schema({
	model: { type: String, default: 'Dice' },
	type: { type: String, default: 'black', required: true, }, // enum: ['hack', 'brawn', 'stealth', 'black']
	amount: { type: Number, default: 0 }
});


const AssetSchema = new Schema({
	model: { type: String, default: 'Asset' },
	type: { type: String, default: 'Asset' },
	tags: [{ type: String }],
	name: { type: String, required: true },
	dice: [ DiceSchema ],
	description: { type: String, required: true },
	status: [{ type: String }],
	owner: { type: String, default: 'None' },
	ownerCharacter: { type: ObjectId, ref: 'Character' },
	currentHolder: { type: String },
	uses: { type: Number, default: 2 }
});

AssetSchema.methods.toggleStatus = async function (tag, remove) {
	if (remove) {
		await clearArrayValue(this.status, tag); //
	}
	else {await addArrayValue(this.status, tag);} //
	return;
};

AssetSchema.methods.addStatus = async function (tag) {
	await addArrayValue(this.status, tag); // Clears the MOBILIZED status if it exists
	let asset = await this.save();
	asset = await asset.populateMe();
	nexusEvent.emit('request', 'update', [ asset ]);
	return asset;
};


AssetSchema.methods.removeStatus = async function (tag) {
	await clearArrayValue(this.status, tag); // Clears the MOBILIZED status if it exists
	
	let asset = await this.save();
	asset = await asset.populateMe();
	nexusEvent.emit('request', 'update', [ asset ]);
	return asset;
};

AssetSchema.methods.use = async function () {
	const asset = await this.toggleStatus('used');
	console.log(`${asset.name} owned by ${asset.owner} has been used.`);
	return;
};

AssetSchema.methods.unuse = async function () {
	const asset = await this.toggleStatus('used', true);
	console.log(`${asset.name} owned by ${asset.owner} has been unused.`);
	return asset;
};

const Asset = mongoose.model('Asset', AssetSchema);

const Bond = Asset.discriminator(
	'Bond',
	new Schema({
		with: { type: ObjectId, ref: 'Character', required: true },
		level: { type: Number, default: 2 } // { type: String, enum: ['Condemned', 'Disfavoured', 'Preferred', 'Favoured', 'Blessed', 'Loathing', 'Unfriendly', 'Neutral', 'Warm', 'Friendly', 'Bonded' ] },
	})
);

module.exports = { Asset, Bond };