import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { nanoid } from "nanoid";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected "))
  .catch(err => console.log("DB Connection Error:", err));

const urlSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortId: { type: String, required: true, unique: true }
});

const Url = mongoose.model("Url", urlSchema);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/shorten", async (req, res) => {
  try {
    const { originalUrl } = req.body;
    if (!originalUrl) return res.status(400).json({ message: "URL required" });

    const shortId = nanoid(4);
    await Url.create({ originalUrl, shortId });

    
    const host = req.headers.host; 
    const protocol = req.headers["x-forwarded-proto"] || "https"; 

    res.json({ shortUrl: `${protocol}://${host}/${shortId}` });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/:shortId", async (req, res) => {
  try {
    const { shortId } = req.params;
    const url = await Url.findOne({ shortId });
    if (url) return res.redirect(url.originalUrl);
    res.status(404).send("URL not found");
  } catch {
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} `);
});
