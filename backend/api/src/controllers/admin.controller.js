import asyncHandler from "express-async-handler";
import csv from "csv-parser";
import fs from "fs";
import crypto from "crypto";
import { cleanResult } from "../utils/cleanResult.js";
// Database Models
import { Transaction } from "../models/transaction.model.js";
import { Vendor } from "../models/vendor.model.js";
import { Department } from "../models/department.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { FileUpload } from "../models/fileUpload.model.js";
import mongoose from "mongoose";
import axios from "axios";
const calculateChecksum = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const stream = fs.createReadStream(filePath);
    stream.on("data", (data) => hash.update(data));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
};

const getFinancialYear = (date) => {
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();
  if (month >= 4) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
};

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const checksum = await calculateChecksum(req.file.path);

  const fileUpload = new FileUpload({
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimeType: req.file.mimetype || "text/csv",
    uploadedBy: req.user._id,
    checksum,
    status: "processing",
    processingStartedAt: new Date(),
  });
  await fileUpload.save();

  const result = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => result.push(data))
    .on("end", async () => {
      try {
        console.log("CSV File parsed successfully");
        console.log(`Total rows: ${result.length}`);

        const cleanedData = cleanResult(result);
        const rejectedRows = result.length - cleanedData.length;

        console.log({
          parsed: result.length,
          cleaned: cleanedData.length,
          rejected: rejectedRows,
        });

        let newTransactions = 0;
        let duplicateTransactions = 0;
        const errors = [];

        for (let i = 0; i < cleanedData.length; i++) {
          const data = cleanedData[i];
          const rowNumber = i + 2;
          try {
            const existingTransaction = await Transaction.findOne({
              transaction_id: data.transaction_id,
            });

            if (existingTransaction) {
              duplicateTransactions++;
              continue;
            }

            let vendor = await Vendor.findOne({ vendor_id: data.vendor_id });
            if (!vendor) {
              vendor = await Vendor.create({
                name: data.vendor_name || `Vendor_${data.vendor_id}`,
                vendor_id: data.vendor_id,
              });
            }

            let department = await Department.findOne({
              name: data.department,
            });
            if (!department) {
              department = await Department.create({
                name: data.department,
                code: data.department.substring(0, 3).toLowerCase(),
              });
            }

            const transactionDate = new Date(data.transaction_date);
            const payment = await Payment.create({
              paymentDate: transactionDate,
              paymentMode: data.payment_mode,
              amount: Number(data.amount),
              reason: data.purpose,
            });

            const transaction = await Transaction.create({
              transaction_id: data.transaction_id,
              transactionDate,
              financialYear: getFinancialYear(transactionDate),
              payment: payment._id,
              department: department._id,
              vendor: vendor._id,
              location: data.location,
              budget_head: data.budget_head,
              month: data.month,
              day: data.day,
              year: data.year,
              isMonthEnd: data.isMonthEnd,
              sourceFile: fileUpload._id,
              sourceRowNumber: rowNumber,
            });

            newTransactions++;
          } catch (err) {
            errors.push({
              row: rowNumber,
              transaction_id: data.transaction_id,
              error: err.message,
            });
            console.error(`Error processing row ${rowNumber}: ${err.message}`);
          }
        }

        fileUpload.stats = {
          totalRows: result.length,
          processedRows: cleanedData.length,
          skippedRows: 0,
          rejectedRows,
          newTransactions,
          duplicateTransactions,
        };
        fileUpload.status = errors.length > 0 ? "completed" : "completed";
        fileUpload.processingCompletedAt = new Date();
        await fileUpload.save();

        console.log({
          newTransactions,
          duplicateTransactions,
          errors: errors.length,
        });

        res.status(200).json({
          message: "File uploaded and processed successfully",
          file: {
            id: fileUpload._id,
            filename: fileUpload.originalName,
            uploadedAt: fileUpload.createdAt,
            checksum: fileUpload.checksum,
          },
          stats: {
            totalRows: result.length,
            validRows: cleanedData.length,
            rejectedRows,
            newTransactions,
            duplicateTransactions,
            processingErrors: errors.length,
          },
          errors: errors.slice(0, 10),
        });
      } catch (err) {
        fileUpload.status = "failed";
        fileUpload.processingError = err.message;
        fileUpload.processingCompletedAt = new Date();
        await fileUpload.save();

        res.status(500);
        throw new Error(`Error processing CSV file: ${err.message}`);
      }
    })
    .on("error", async (err) => {
      fileUpload.status = "failed";
      fileUpload.processingError = err.message;
      fileUpload.processingCompletedAt = new Date();
      await fileUpload.save();

      res.status(500);
      throw new Error("Error parsing CSV file");
    });
});

const getUploadHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const uploads = await FileUpload.find({ uploadedBy: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("uploadedBy", "name email");

  const total = await FileUpload.countDocuments({ uploadedBy: req.user._id });

  res.status(200).json({
    uploads,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const getTransactionsByFile = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  const fileUpload = await FileUpload.findById(fileId);
  if (!fileUpload) {
    res.status(404);
    throw new Error("File upload not found");
  }

  const transactions = await Transaction.find({ sourceFile: fileId })
    .sort({ sourceRowNumber: 1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("vendor", "name vendor_id")
    .populate("department", "name code")
    .populate("payment", "amount paymentMode paymentDate reason");

  const total = await Transaction.countDocuments({ sourceFile: fileId });

  res.status(200).json({
    file: {
      id: fileUpload._id,
      originalName: fileUpload.originalName,
      uploadedAt: fileUpload.createdAt,
      stats: fileUpload.stats,
    },
    transactions,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

const generateAnalysis = asyncHandler(async (req, res) => {
  const { fileId } = req.params;
  const file = await FileUpload.findOne({ _id: fileId });
  if (!file) {
    res.status(404);
    throw new Error("Invalid File ID provided.");
  }
  const transactions = await Transaction.aggregate([
    { $match: { sourceFile: new mongoose.Types.ObjectId(fileId) } },
    {
      $lookup: {
        from: "vendors",
        localField: "vendor",
        foreignField: "_id",
        as: "Vendor",
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "department",
        foreignField: "_id",
        as: "Department",
      },
    },
    {
      $lookup: {
        from: "payments",
        localField: "payment",
        foreignField: "_id",
        as: "Payment",
      },
    },
    { $unwind: "$Vendor" },
    { $unwind: "$Department" },
    { $unwind: "$Payment" },
    {
      $project: {
        transaction_id: 1,
        transactionDate: 1,
        financialYear: 1,
        location: 1,
        budget_head: 1,
        month: 1,
        day: 1,
        isMonthEnd: 1,
        year: 1,
        Vendor: {
          vendor_id: 1,
          name: 1,
        },
        Department: {
          name: 1,
          code: 1,
        },
        Payment: {
          paymentDate: 1,
          paymentMode: 1,
          amount: 1,
          reason: 1,
        },
      },
    },
  ]);

  const transformedTransactions = transactions.map((t) => ({
    payment_uid: t.transaction_id,
    amount: t.Payment.amount,
    department: t.Department.name,
    vendor_id: t.Vendor.vendor_id,
    transaction_date: t.transactionDate,
    month: t.month,
    isMonthEnd: t.isMonthEnd,
  }));

  const payload = {
    datasetId: fileId,
    transactions: transformedTransactions,
  };

  const response = await axios.post("http://127.0.0.1:5000/analyze", payload, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log(response.data);

  res.status(200).json(response.data);
});

export { upload, getUploadHistory, getTransactionsByFile, generateAnalysis };
