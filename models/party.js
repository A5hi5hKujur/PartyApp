var mongoose = require("mongoose");

var partySchema = new mongoose.Schema({
    party_theme: String,
    party_name: String,
    venue: String,
    date: Date,
    participants: [
            {
                id:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                contribution: Number,
                balance: Number,
                host: Boolean
            }
    ],
    totalcost: Number,
    totalcontribution: Number,
    totalpurchased: Number,
    items: [
            {
                name: String,
                category: String,
                quantity: Number,
                price: Number,
                priority: Number,
                purchased: Boolean,
                essential: Boolean,
                consumers: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User"
                    }
                ],
                forall: Boolean
            }
    ],
    hosts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ], 
    description: String,
    status: String
});

module.exports = mongoose.model("Party",partySchema);