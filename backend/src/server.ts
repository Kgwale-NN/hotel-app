import express from "express";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    message: "Hotel API is running",
  });
});

app.listen(PORT, () => {
  console.log(`Hotel API is running at http://localhost:${PORT}`);
});