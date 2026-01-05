import asyncHandler from "express-async-handler";
import User from "../models/user.model.js";

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("No file uploaded");
  }

  const fileData = {
    filename: req.file.filename,
    originalname: req.file.originalname,
    path: req.file.path,
    size: req.file.size,
    mimetype: req.file.mimetype,
    uploadedBy: req.user._id,
    uploadedAt: new Date(),
  };

  res.status(200).json({
    message: "File uploaded successfully",
    file: fileData,
  });
});

export { upload };