import prisma from "@studyAbroad/prisma";
import { BaseServiceController } from "@studyAbroad/grpc-utils";
import { signupHandler } from "../handlers/signup.handler.js";
import { signinHandler } from "../handlers/signin.handler.js";
import { refreshTokenHandler } from "../handlers/refreshToken.handler.js";

class AuthController extends BaseServiceController {
  constructor() {
    // Initialize with Prisma User model
    super(prisma.user);
  }

  async signup(call, callback) {
    await signupHandler(this, call, callback);
  }

  async signin(call, callback) {
    await signinHandler(this, call, callback);
  }

  async refreshToken(call, callback) {
    await refreshTokenHandler(this, call, callback);
  }
}

export default AuthController;
