var mongoose = require("mongoose");

var itemSchema = new mongoose.Schema({
    name: String,
    quantity: String,
    price: String,
    priority: Number,
    essential: Boolean
});

module.exports = mongoose.model("Item",itemSchema);