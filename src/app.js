import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import adminRouter from "./routers/admin.js";
import authRouter from "./routers/auth.js";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined!");
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔗 Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

connectDB();
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);

// const PORT = 2625;
// app.listen(PORT, async () => {
//     console.log(`🚀 Server running at http://localhost:${PORT}`);

//     const listener = await ngrok.connect({
//         addr: PORT,
//         authtoken: process.env.NGROK_AUTHTOKEN,
//     });

//     console.log(`🌍 Ngrok URL: ${listener.url()}`);
// });

const PORT = process.env.PORT || 5175;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});

export { app };
