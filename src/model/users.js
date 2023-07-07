import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password:{ type: String, minLength: 8, required: true },
});

const User_model = mongoose.model("Users", userSchema);

export default User_model;