import grpc from "@grpc/grpc-js";
import { BaseGrpcService } from "./baseService.js";
import { getUserIdFromMetadata } from "./jwt.js";

class BaseServiceController {
  constructor(mongooseModel = null, jwtSecret = null) {
    this.model = mongooseModel;
    this.jwtSecret = jwtSecret || process.env.JWT_SECRET;
  }

  async execute(call, callback, handler) {
    await BaseGrpcService.asyncHandler(callback, async () => {
      await handler();
    });
  }

  sendSuccess(callback, ResponseType, data) {
    callback(null, BaseGrpcService.successResponse(ResponseType, data));
  }

  sendError(callback, status, message) {
    return BaseGrpcService.sendError(callback, status, message);
  }

  validateFields(callback, data, requiredFields) {
    return BaseGrpcService.validateAndSendError(callback, data, requiredFields);
  }

  validateField(callback, value, validator, errorMessage) {
    if (!validator(value)) {
      this.sendError(callback, grpc.status.INVALID_ARGUMENT, errorMessage);
      return true;
    }
    return false;
  }

  getUserId(call) {
    try {
      if (!this.jwtSecret) {
        this.logError("JWT_SECRET is not configured");
        return null;
      }
      return getUserIdFromMetadata(call.metadata, this.jwtSecret);
    } catch (err) {
      this.logError("Failed to get user ID from metadata", err);
      return null;
    }
  }

  getUserIdOrFail(call, callback) {
    const userId = this.getUserId(call);

    if (!userId) {
      this.sendError(
        callback,
        grpc.status.UNAUTHENTICATED,
        "Authentication required"
      );
      return null;
    }

    return userId;
  }

  verifyOwnership(callback, resourceUserId, authenticatedUserId) {
    if (resourceUserId !== authenticatedUserId) {
      this.sendError(callback, grpc.status.PERMISSION_DENIED, "Access denied");
      return false;
    }
    return true;
  }

  async findById(id, options = {}) {
    try {
      let query = this.model.findById(id);

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.populate) {
        query = query.populate(options.populate);
      }

      return await query.exec();
    } catch (error) {
      console.error("FindById error:", error);
      return null;
    }
  }

  async findByIdOrFail(callback, id, options = {}) {
    const record = await this.findById(id, options);

    if (!record) {
      this.sendError(
        callback,
        grpc.status.NOT_FOUND,
        `${this.getModelName()} not found`
      );
      return null;
    }

    return record;
  }

  async findOne(where, options = {}) {
    try {
      let query = this.model.findOne(where);

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.populate) {
        query = query.populate(options.populate);
      }

      return await query.exec();
    } catch (error) {
      console.error("FindOne error:", error);
      return null;
    }
  }

  async findOneOrFail(callback, where, options = {}) {
    const record = await this.findOne(where, options);

    if (!record) {
      this.sendError(
        callback,
        grpc.status.NOT_FOUND,
        `${this.getModelName()} not found`
      );
      return null;
    }

    return record;
  }

  async findMany(options = {}) {
    try {
      let query = this.model.find(options.where || {});

      if (options.skip) {
        query = query.skip(options.skip);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.sort) {
        query = query.sort(options.sort);
      }

      if (options.select) {
        query = query.select(options.select);
      }

      if (options.populate) {
        query = query.populate(options.populate);
      }

      return await query.exec();
    } catch (error) {
      console.error("FindMany error:", error);
      return [];
    }
  }

  async count(where = {}) {
    try {
      return await this.model.countDocuments(where);
    } catch (error) {
      console.error("Count error:", error);
      return 0;
    }
  }

  async exists(where) {
    try {
      const count = await this.model.countDocuments(where).limit(1);
      return count > 0;
    } catch (error) {
      console.error("Exists error:", error);
      return false;
    }
  }

  async checkExistsAndFail(callback, where, message = null) {
    const exists = await this.exists(where);

    if (exists) {
      this.sendError(
        callback,
        grpc.status.ALREADY_EXISTS,
        message || `${this.getModelName()} already exists`
      );
      return true;
    }

    return false;
  }

  async create(data, options = {}) {
    try {
      const document = await this.model.create(data);

      if (options.populate) {
        return await document.populate(options.populate);
      }

      return document;
    } catch (error) {
      console.error("Create error:", error);
      throw error;
    }
  }

  async createMany(data) {
    try {
      return await this.model.insertMany(data, {
        ordered: false, // Continue on duplicate key errors
      });
    } catch (error) {
      // Return successfully inserted documents even if some failed
      if (error.writeErrors) {
        return error.insertedDocs || [];
      }
      throw error;
    }
  }

  async update(where, data, options = {}) {
    try {
      const id = where.id || where._id;

      return await this.model.findByIdAndUpdate(
        id,
        { $set: data },
        {
          new: true, // Return updated document
          runValidators: true,
          ...options,
        }
      );
    } catch (error) {
      console.error("Update error:", error);
      throw error;
    }
  }

  async updateMany(where, data) {
    try {
      return await this.model.updateMany(where, { $set: data });
    } catch (error) {
      console.error("UpdateMany error:", error);
      throw error;
    }
  }

  async upsert(where, create, update, options = {}) {
    try {
      // MongoDB upsert using findOneAndUpdate
      return await this.model.findOneAndUpdate(
        where,
        {
          $set: update,
          $setOnInsert: create,
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          ...options,
        }
      );
    } catch (error) {
      console.error("Upsert error:", error);
      throw error;
    }
  }

  async delete(where) {
    try {
      return await this.model.deleteMany(where);
    } catch (error) {
      console.error("Delete error:", error);
      throw error;
    }
  }

  async deleteById(id) {
    try {
      return await this.model.findByIdAndDelete(id);
    } catch (error) {
      console.error("DeleteById error:", error);
      throw error;
    }
  }

  async getOrCreate(userId, defaults = {}) {
    let resource = await this.findOne({ user_id: userId });

    if (!resource) {
      resource = await this.create({
        user_id: userId,
        ...defaults,
      });
    }

    return resource;
  }

  async transaction(handler) {
    // MongoDB transactions using session
    const { mongoose } = await import("@studyAbroad/mongodb");
    const session = await mongoose.startSession();

    try {
      session.startTransaction();
      const result = await handler(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async transactionWithErrorHandling(callback, handler) {
    try {
      return await this.transaction(handler);
    } catch (err) {
      console.error("Transaction failed:", err);
      this.sendError(
        callback,
        grpc.status.INTERNAL,
        err.message || "Transaction failed"
      );
      return null;
    }
  }

  buildPaginationOptions(limit = 100, offset = 0, orderBy = {}) {
    return {
      skip: Math.max(0, offset),
      limit: limit,
      sort: orderBy || { createdAt: -1 },
    };
  }

  async findWithPagination(where = {}, limit = 100, offset = 0, options = {}) {
    try {
      const [data, total] = await Promise.all([
        this.model
          .find(where)
          .skip(offset)
          .limit(limit)
          .sort(options.sort || { createdAt: -1 })
          .select(options.select)
          .exec(),
        this.model.countDocuments(where),
      ]);

      return {
        data,
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error("FindWithPagination error:", error);
      return { data: [], total: 0, limit, offset, hasMore: false };
    }
  }

  getModelName() {
    return (
      this.model?.modelName || this.constructor.name.replace("Controller", "")
    );
  }

  sanitizeUser(user) {
    if (!user) return null;
    const userObj = user.toObject ? user.toObject() : user;
    const { password, refreshToken, ...safeUser } = userObj;

    // Convert _id to id for consistency
    if (safeUser._id) {
      safeUser.id = safeUser._id.toString();
      delete safeUser._id;
    }

    return safeUser;
  }

  sanitizeObject(obj, fields = ["password", "refreshToken"]) {
    if (!obj) return null;

    const sanitized = obj.toObject ? obj.toObject() : { ...obj };
    fields.forEach((field) => {
      delete sanitized[field];
    });

    // Convert _id to id
    if (sanitized._id) {
      sanitized.id = sanitized._id.toString();
      delete sanitized._id;
    }

    return sanitized;
  }

  extractFields(source, fields) {
    return fields.reduce((acc, field) => {
      if (source[field] !== undefined) {
        acc[field] = source[field];
      }
      return acc;
    }, {});
  }

  parseInt(value, defaultValue = 0) {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  parseFloat(value, defaultValue = 0) {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  formatDate(date) {
    if (date instanceof Date) return date;
    return new Date(date || Date.now());
  }

  log(message, data = null) {
    console.log(`[${this.getModelName()}] ${message}`, data || "");
  }

  logError(message, error = null) {
    console.error(`[${this.getModelName()}] ERROR: ${message}`, error || "");
  }

  async groupCount(where = {}, groupBy) {
    try {
      // MongoDB aggregation for group count
      return await this.model.aggregate([
        { $match: where },
        {
          $group: {
            _id: `$${groupBy}`,
            count: { $sum: 1 },
          },
        },
      ]);
    } catch (error) {
      console.error("GroupCount error:", error);
      return [];
    }
  }

  async sum(where = {}, field) {
    try {
      const result = await this.model.aggregate([
        { $match: where },
        {
          $group: {
            _id: null,
            total: { $sum: `$${field}` },
          },
        },
      ]);
      return result[0]?.total || 0;
    } catch (error) {
      console.error("Sum error:", error);
      return 0;
    }
  }

  async avg(where = {}, field) {
    try {
      const result = await this.model.aggregate([
        { $match: where },
        {
          $group: {
            _id: null,
            average: { $avg: `$${field}` },
          },
        },
      ]);
      return result[0]?.average || 0;
    } catch (error) {
      console.error("Avg error:", error);
      return 0;
    }
  }

  async min(where = {}, field) {
    try {
      const result = await this.model.aggregate([
        { $match: where },
        {
          $group: {
            _id: null,
            minimum: { $min: `$${field}` },
          },
        },
      ]);
      return result[0]?.minimum;
    } catch (error) {
      console.error("Min error:", error);
      return null;
    }
  }

  async max(where = {}, field) {
    try {
      const result = await this.model.aggregate([
        { $match: where },
        {
          $group: {
            _id: null,
            maximum: { $max: `$${field}` },
          },
        },
      ]);
      return result[0]?.maximum;
    } catch (error) {
      console.error("Max error:", error);
      return null;
    }
  }
}

export { BaseServiceController };
