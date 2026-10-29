import app from "./app";
import { expirePendingBookingHolds } from "./services/booking-expiration.service";

const PORT = 3000;
const BOOKING_EXPIRATION_INTERVAL_MS = 60_000;

const server = app.listen(PORT);

server.on("listening", () => {
  console.log(`Hotel API is running at http://localhost:${PORT}`);

  const expireHolds = async (): Promise<void> => {
    try {
      const expiredCount = await expirePendingBookingHolds();
      if (expiredCount > 0) {
        console.log(`Expired ${expiredCount} pending booking hold(s).`);
      }
    } catch {
      console.error("Unable to expire pending booking holds.");
    }
  };

  void expireHolds();
  const expirationTimer = setInterval(
    () => void expireHolds(),
    BOOKING_EXPIRATION_INTERVAL_MS
  );
  expirationTimer.unref();
  server.on("close", () => clearInterval(expirationTimer));
});

server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other backend first.`);
  } else {
    console.error("Failed to start the backend:", error.message);
  }

  process.exit(1);
});
