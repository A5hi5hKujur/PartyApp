var mongoose = require("mongoose");

var partySchema = new mongoose.Schema({
    name: String,
    venue: String,
    date: {type: Date},
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
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item"
            }
    ],
    status: String,
});

module.exports = mongoose.model("Party",partySchema);