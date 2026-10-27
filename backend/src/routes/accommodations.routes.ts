import { Router } from "express";
import { getAccommodations } from "../controllers/accommodations.controller";

const accommodationsRouter = Router();

accommodationsRouter.get("/", getAccommodations);

export default accommodationsRouter;