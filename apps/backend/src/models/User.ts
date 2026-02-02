import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
});

export const UserModel = mongoose.model("Users", UserSchema);
