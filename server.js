const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection (Isko hum MongoDB link aane par update karenge)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/earnhub';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Database connected'))
  .catch(err => console.log('DB error:', err));

const User = mongoose.model('User', new mongoose.Schema({
    userId: String,
    balance: { type: Number, default: 0 }
}));

const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    transactionId: { type: String, unique: true },
    userId: String,
    amount: Number
}));

// User balance check API
app.get('/api/user/:id', async (req, res) => {
    let user = await User.findOne({ userId: req.params.id });
    if (!user) user = await User.create({ userId: req.params.id, balance: 0 });
    res.json(user);
});

// Postback endpoint (Offerwall yahan signal bhejegi)
app.get('/api/postback', async (req, res) => {
    const { user_id, amount, secret, transaction_id } = req.query;

    if (secret !== "MY_SECRET_KEY_123") {
        return res.status(403).send("Unauthorized");
    }

    try {
        const exists = await Transaction.findOne({ transactionId: transaction_id });
        if (exists) return res.send("OK");

        const userReward = parseFloat(amount) * 0.50; // 50% user ko, 50% aapka

        await Transaction.create({ transactionId: transaction_id, userId: user_id, amount: userReward });
        await User.updateOne({ userId: user_id }, { $inc: { balance: userReward } });

        res.send("OK");
    } catch (err) {
        res.status(500).send("Error");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
