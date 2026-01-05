import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  paymentDate: {
    type: Date,
    required: true,
  },
  paymentMode: {
    type: String,
    required: true,
    enum: ["NEFT", "RTGS", "Cheque"],
  },
  amount: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    required: true,
    // minlength
    // maxlength
  },
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
