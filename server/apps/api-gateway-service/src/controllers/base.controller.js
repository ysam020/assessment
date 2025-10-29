import {
  GrpcErrorHandler,
  ResponseFormatter,
  GrpcClientManager,
} from "@studyAbroad/grpc-utils";

// Handles HTTP requests and delegates to gRPC microservices
class BaseController {
  constructor(grpcClient) {
    this.client = grpcClient;
  }

  // Extract specific fields from request body
  extractFields(req, fields) {
    const payload = {};
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        payload[field] = req.body[field];
      }
    });
    return payload;
  }

  // Get user ID from JWT middleware
  getUserId(req) {
    return req.user?.userId || req.user?.id;
  }

  // Send unauthorized response
  sendUnauthorized(res, message = "Unauthorized") {
    return res.status(401).json({
      success: false,
      error: message,
    });
  }

  // Send not found response
  sendNotFound(res, message = "Resource not found") {
    return res.status(404).json({
      success: false,
      error: message,
    });
  }

  // Sanitize user object
  sanitizeUser(user) {
    if (!user) return null;
    const { password, refreshToken, ...safeUser } = user;
    return safeUser;
  }

  // Execute gRPC call
  async executeGrpcCall(
    req,
    res,
    method,
    payload,
    {
      transformer = (response) => response,
      successMessage = "Operation successful",
      errorMessage = "Operation failed",
      statusCode = 200,
      includeMetadata = false,
      requireAuth = false,
      notFoundCheck = null,
      notFoundMessage = "Resource not found",
    } = {}
  ) {
    try {
      // Check authentication if required
      if (requireAuth) {
        const userId = this.getUserId(req);
        if (!userId) {
          return this.sendUnauthorized(res);
        }
      }

      // Prepare arguments for gRPC call
      const args = [payload];

      // Add metadata for authenticated requests
      if (includeMetadata) {
        args.push(GrpcClientManager.createMetadata(req));
      }

      // Add callback
      args.push(
        GrpcErrorHandler.wrapCallback(
          res,
          (response) => {
            // Check if resource not found
            if (notFoundCheck && notFoundCheck(response)) {
              return this.sendNotFound(res, notFoundMessage);
            }

            // Transform response data
            const transformedData = transformer(response);

            // Handle dynamic success messages
            const message =
              typeof successMessage === "function"
                ? successMessage(response)
                : successMessage;

            // Send success response
            ResponseFormatter.success(
              res,
              transformedData,
              message,
              statusCode
            );
          },
          errorMessage
        )
      );

      // Execute the gRPC method
      if (typeof this.client[method] !== "function") {
        throw new Error(`Method ${method} not found on gRPC client`);
      }

      this.client[method](...args);
    } catch (error) {
      console.error(`Error in ${method}:`, error);
      ResponseFormatter.error(res, error.message || errorMessage);
    }
  }
}

export default BaseController;
