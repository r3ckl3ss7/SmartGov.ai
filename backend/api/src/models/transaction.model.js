import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    transaction_id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    transactionDate: {
      type: Date,
      required: true,
    },
    financialYear: {
      type: String,
      required: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    budget_head: {
      type: String,
      required: true,
      trim: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    day: {
      type: Number,
      min: 1,
      max: 31,
    },
    isMonthEnd: {
      type: Boolean,
      default: false,
    },
    year: {
      type: Number,
      required: true,
    },
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    riskLevel: {
      type: String,
      enum: ["Extreme", "High", "Moderate", "Low", null],
      default: null,
    },
    sourceFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FileUpload",
      required: true,
      index: true,
    },
    sourceRowNumber: {
      type: Number,
    },
  },
  {
    timestamps: true, 
  }
);

transactionSchema.index({ department: 1, transactionDate: -1 });
transactionSchema.index({ vendor: 1, transactionDate: -1 });
transactionSchema.index({ sourceFile: 1, sourceRowNumber: 1 });
transactionSchema.index({ riskLevel: 1, transactionDate: -1 });
transactionSchema.index({ financialYear: 1, month: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);
export { Transaction };
