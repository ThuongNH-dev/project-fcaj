import swaggerJSDoc from "swagger-jsdoc";

const definition = {
  openapi: "3.0.3",
  info: {
    title: "Project FCAJ Backend API",
    version: "1.0.0",
    description: "Swagger documentation for the backend API.",
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
};

export default swaggerSpec;
