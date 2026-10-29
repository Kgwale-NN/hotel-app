import { Router } from "express";
import {
  addFavourite,
  getMyFavourites,
  removeFavourite,
} from "../controllers/favourites.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { requireCsrf } from "../middleware/csrf.middleware";

const favouritesRouter = Router();

favouritesRouter.use(requireAuth);
favouritesRouter.get("/", getMyFavourites);
favouritesRouter.post("/:accommodationId", requireCsrf, addFavourite);
favouritesRouter.delete("/:accommodationId", requireCsrf, removeFavourite);

export default favouritesRouter;
