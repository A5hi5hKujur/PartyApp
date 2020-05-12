var mongoose = require("mongoose");

var partySchema = new mongoose.Schema({
    name: String,
    venue: String,
    date: Date,
    participants: [
            {
                id:{
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                contribution: Number,
                host: Boolean
            }
    ],
    totalcost: Number,
    totalcontribution: Number,
    items: [
            {
                name: String,
                category: String,
                quantity: String,
                price: String,
                priority: Number,
                purchased: Boolean,
                essential: Boolean
            }
    ],
    status: String,
});

module.exports = mongoose.model("Party",partySchema);