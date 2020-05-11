const mongoose   = require("mongoose");
const Party      = require("./party");

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true
      },
    lname:{
        type: String,
        required: true
      },
    email: {
        type: String,
        required: true
      },
    password: {
        type: String,
        required: true
      },
    mobile_no: {
        type: String,
        required: true
    },
    parties:[{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Party"
    }]
});

module.exports = mongoose.model("User",userSchema);