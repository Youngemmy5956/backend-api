import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    // email: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    password:{ type: String, minLength: 8, required: true },


});

const Order_model = mongoose.model("Orders", userSchema);

export default Order_model;