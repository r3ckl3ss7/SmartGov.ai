import multer from "multer";
import path from "path";
import fs from "fs";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    fs.mkdirSync("src/uploads");
    cb(null, "src/uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const uploads = multer({ storage });
export { uploads };
