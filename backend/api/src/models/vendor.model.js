import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
  vendor_id: { type: String, unique: true, required: true },
  name: { type: String, unique: true, required: true },
});
const Vendor = mongoose.model("Vendor", vendorSchema);

export { Vendor };
