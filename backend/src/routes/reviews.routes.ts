import { Router } from "express";
import {
  createReview,
  deleteReview,
  getAccommodationReviews,
  updateReview,
} from "../controllers/reviews.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";

const reviewsRouter = Router();

reviewsRouter.get("/accommodation/:accommodationId", getAccommodationReviews);
reviewsRouter.post("/:accommodationId", requireAuth, requireCsrf, createReview);
reviewsRouter.patch("/:reviewId", requireAuth, requireCsrf, updateReview);
reviewsRouter.delete("/:reviewId", requireAuth, requireCsrf, deleteReview);

export default reviewsRouter;
