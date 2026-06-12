import swaggerJSDoc from "swagger-jsdoc";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Project FCAJ Backend API",
    version: "1.0.0",
    description: "Swagger documentation for the backend API.",
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  servers: [
    {
      url: "/",
      description: "Current server origin",
    },
  ],
};

const swaggerSpec = swaggerJSDoc({
  definition,
  apis: [],
});

swaggerSpec.paths = {
  "/health": {
    get: {
      summary: "Check backend and MongoDB status",
      tags: ["System"],
      responses: {
        200: {
          description: "Backend and MongoDB are connected",
        },
        503: {
          description: "Backend is running but MongoDB is unavailable",
        },
      },
    },
  },
  "/api/test": {
    get: {
      summary: "Test MongoDB read/write connectivity",
      tags: ["System"],
      responses: {
        200: {
          description: "MongoDB test document written and returned",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
  "/api/auth/register": {
    post: {
      summary: "Register a new user",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["firstName", "lastName", "email", "password"],
              properties: {
                firstName: {
                  type: "string",
                  example: "Thuong",
                },
                lastName: {
                  type: "string",
                  example: "Nguyen",
                },
                email: {
                  type: "string",
                  format: "email",
                  example: "thuong@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "secret123",
                },
                bio: {
                  type: "string",
                  example: "Trip organizer and finance lead.",
                },
                avatarUrl: {
                  type: "string",
                  example: "https://example.com/avatar.png",
                },
                defaultCurrency: {
                  type: "string",
                  example: "USD",
                },
                role: {
                  type: "string",
                  enum: ["admin", "user"],
                  example: "user",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Account created successfully",
        },
        400: {
          description: "Invalid request payload",
        },
        409: {
          description: "Email already exists",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
  "/api/auth/login": {
    post: {
      summary: "Login a user",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "thuong@example.com",
                },
                password: {
                  type: "string",
                  format: "password",
                  example: "secret123",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
        },
        400: {
          description: "Missing email or password",
        },
        401: {
          description: "Invalid credentials",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
  "/api/users/me": {
    get: {
      summary: "Get the current logged-in user's profile",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "User profile fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
    patch: {
      summary: "Update the current logged-in user's profile",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                firstName: {
                  type: "string",
                  example: "Thuong",
                },
                lastName: {
                  type: "string",
                  example: "Nguyen",
                },
                bio: {
                  type: "string",
                  example: "Trip organizer and finance lead.",
                },
                avatarUrl: {
                  type: "string",
                  example: "https://example.com/avatar.png",
                },
                defaultCurrency: {
                  type: "string",
                  enum: ["USD", "VND"],
                  example: "VND",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User profile updated successfully",
        },
        400: {
          description: "Invalid update payload",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
  "/api/users/me/password": {
    patch: {
      summary: "Change the current logged-in user's password",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["currentPassword", "newPassword"],
              properties: {
                currentPassword: {
                  type: "string",
                  format: "password",
                  example: "secret123",
                },
                newPassword: {
                  type: "string",
                  format: "password",
                  example: "newsecret123",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Password updated successfully",
        },
        400: {
          description: "Missing or invalid password payload",
        },
        401: {
          description: "Missing or invalid bearer token, or current password is incorrect",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
};

export default swaggerSpec;
