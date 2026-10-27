import app from "./app";

const PORT = 3000;

const server = app.listen(PORT);

server.on("listening", () => {
  console.log(`Hotel API is running at http://localhost:${PORT}`);
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other backend first.`);
  } else {
    console.error("Failed to start the backend:", error.message);
  }

  process.exit(1);
});