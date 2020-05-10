var mongoose = require("mongoose");

var participantSchema = new mongoose.Schema({
    participant: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    name: String,
    

});

module.exports = mongoose.model("Participant",participantSchema);