import { Router } from "express";
import authRouter from "./auth.route.js";
import recommendationsRouter from "./recommendations.route.js";
import courseRouter from "./course.route.js";
import { jwtMiddleware } from "../middlewares/auth.middleware.js";

const rootRouter = Router();

// Public routes
rootRouter.use("/auth", authRouter);

// Protected routes
rootRouter.use("/recommendations", recommendationsRouter);
rootRouter.use("/course", courseRouter);

// Health check endpoint
rootRouter.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "API Gateway",
  });
});

// Protected admin-only route example
rootRouter.get("/admin/test", jwtMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You have accessed a protected admin route",
    user: req.user,
  });
});

export default rootRouter;
