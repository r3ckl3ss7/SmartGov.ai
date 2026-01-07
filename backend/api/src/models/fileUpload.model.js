import mongoose from "mongoose";

const fileUploadSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ["text/csv", "application/vnd.ms-excel"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    stats: {
      totalRows: {
        type: Number,
        default: 0,
      },
      processedRows: {
        type: Number,
        default: 0,
      },
      skippedRows: {
        type: Number,
        default: 0,
      },
      rejectedRows: {
        type: Number,
        default: 0,
      },
      newTransactions: {
        type: Number,
        default: 0,
      },
      duplicateTransactions: {
        type: Number,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    processingError: {
      type: String,
      default: null,
    },
    checksum: {
      type: String,
    },
    processingStartedAt: {
      type: Date,
    },
    processingCompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, 
  }
);

fileUploadSchema.index({ uploadedBy: 1, createdAt: -1 });
fileUploadSchema.index({ status: 1 });

const FileUpload = mongoose.model("FileUpload", fileUploadSchema);

export { FileUpload };
