import mongoose from "mongoose";

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const EntrySchema = new Schema({
  userId: { type: ObjectId, ref: "Users", required: true },
  date: { type: Date, required: [true, "Date is required"] },
  title: { type: String },
  text: { type: String },
  mood: {
    type: String,
    enum: ["excellent", "good", "neutral", "bad", "terrible"],
    required: [true, "Mood is required"],
  },
  todos: {
    type: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
  },
  tags: {
    type: [String],
    default: [],
  },
});

EntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export const EntryModel = mongoose.model("Entries", EntrySchema);
