require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    name: "Creator AI V2",
    version: "0.1.0"
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Creator AI V2 backend running on http://localhost:${PORT}`);
});
