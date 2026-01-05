import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
});
const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;
