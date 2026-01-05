import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log(process.env.MONGO_URI)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database successfully")
  } catch (error) {
    console.log("Error while connecting to Database");
    console.log("Error : ", error);
  }
};

export default connectDB