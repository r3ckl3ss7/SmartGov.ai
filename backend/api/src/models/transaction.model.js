import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  transactionDate: {
    type: Date,
    required: true,
  },
  financialYear: {
    type: String,
    required: true,
  },

  payment: {
    type: mongoose.Types.ObjectId,
    ref: "Payment",
  },
  department: {
    type: mongoose.Types.ObjectId,
    ref: "Department",
  },
  vendor: {
    type: mongoose.Types.ObjectId,
    ref: "Vendor",
  },
  location: {
    type: String,
    required: true,
  },
  budget_head: {
    type: String,
    required: true,
  },
  riskScore: {
    type: Number,
  },
  riskLevel: {
    type: String,
    enum: ["Extreme", "High", "Moderate", "Low"],
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);
export default Transaction;
