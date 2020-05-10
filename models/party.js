var mongoose = require("mongoose");

var partySchema = new mongoose.Schema({
    name: String,
    venue: String,
    date: {type: Date},
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Participant"
        }
    ],
    menu: [{name: String}], //will be later verified
    totalcost: Number,
    totalcontribution: Number,
    items: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Item"
            }
    ],
    status: String
});

module.exports = mongoose.model("Party",partySchema);