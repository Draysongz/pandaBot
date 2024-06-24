const mongoose = require("mongoose");

const userDetailsSchema = new mongoose.Schema({
    userId: { type: Number, unique: true },
    username: String,
    firstName: String,
    lastName: String,
    referralLink: { type: String, default: "null" },
    referralCount: { type: Number, default: 0 },
    downlines: [
        {
            userId: { type: Number },
            username: String,
            firstName: String,
            lastName: String,
        }
    ],
    balance: { type: Number, default: 0 },
}, { timestamps: true });

const UserDetails = mongoose.model('Users', userDetailsSchema);

module.exports = {
    UserDetails
};
