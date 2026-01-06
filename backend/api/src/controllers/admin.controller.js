import asyncHandler from "express-async-handler";
import csv from "csv-parser";
import fs from "fs";
import { cleanResult } from "../utils/cleanResult.js";
// Database Models
import { Transaction } from "../models/transaction.model.js";
import { Vendor } from "../models/vendor.model.js";
import { Department } from "../models/department.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const result = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => result.push(data))
    .on("end", () => {
      console.log("CSV File parsed successfully");
      console.log(result.length);

      const fileData = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedBy: req.user._id,
        uploadedAt: new Date(),
      };
      const cleanedData = cleanResult(result);
      console.log({
        parsed: rows.length,
        cleaned: cleanedData.length,
        rejected: rows.length - cleanedData.length,
      });

      // db operations
      for (let data of cleanedData) {
      }
      res.status(200).json({
        message: "File uploaded successfully",
        file: fileData,
        rows: result.length,
        data: result,
      });
    })
    .on("error", (err) => {
      res.status(500);
      throw new Error("Error parsing CSV file");
    });
});

export { upload };
