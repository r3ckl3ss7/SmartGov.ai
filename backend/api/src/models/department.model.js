import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
});
const Department = mongoose.model("Department", departmentSchema);

export {Department};
