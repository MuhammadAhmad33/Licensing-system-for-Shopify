require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const License = require('./models/License');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI,)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.log(error));

// Helper function to generate a license key
function generateLicenseKey() {
    return crypto.randomBytes(16).toString('hex');
}

// Endpoint to create a license (Admin access only)
app.post('/api/generate-license', async (req, res) => {
    const { expiryDate } = req.body;
    try {
        const key = generateLicenseKey();
        const license = new License({ key, expiresAt: expiryDate });
        await license.save();
        res.json({ message: 'License generated successfully', key });
    } catch (error) {
        res.status(500).json({ message: 'Error generating license', error: error.message });
    }
});

// Endpoint to validate license
app.post('/api/validate-license', async (req, res) => {
    const { key, storeUrl } = req.body;
    try {
        const license = await License.findOne({ key });
        if (!license || license.activated) {
            return res.status(400).json({ valid: false, message: 'Invalid or already activated license' });
        }

        license.activated = true;
        license.storeUrl = storeUrl;
        await license.save();

        const token = jwt.sign({ key: license.key, storeUrl: license.storeUrl }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({ valid: true, token, message: 'License activated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error validating license', error: error.message });
    }
});

// Endpoint to check license status (for store verification)
app.get('/api/check-license', async (req, res) => {
    const { token } = req.headers;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const license = await License.findOne({ key: decoded.key });
        
        if (license && license.activated && license.storeUrl === decoded.storeUrl) {
            return res.json({ valid: true, message: 'License is active and valid' });
        }
        res.json({ valid: false, message: 'License is invalid or expired' });
    } catch (error) {
        res.status(500).json({ message: 'Error checking license', error: error.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
