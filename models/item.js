var mongoose = require("mongoose");

var itemSchema = new mongoose.Schema({
    name: String,
    category: String,
    quantity: String,
    price: String,
    priority: Number,
    purchased: Boolean,
    essential: Boolean
});

module.exports = mongoose.model("Item",itemSchema);