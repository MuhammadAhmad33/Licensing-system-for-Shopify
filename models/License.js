const mongoose = require('mongoose');

const licenseSchema = new mongoose.Schema({
    key: { type: String, unique: true, required: true },
    storeUrl: { type: String, default: null },
    activated: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('License', licenseSchema);
