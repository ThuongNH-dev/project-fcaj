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
  "/api/auth/forgot-password": {
    post: {
      summary: "Request a password reset OTP and reset link",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "thuong@example.com",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description:
            "Password reset request accepted. The response does not reveal whether the email exists.",
        },
        400: {
          description: "Missing email",
        },
        503: {
          description: "MongoDB connection failed or email provider failed",
        },
      },
    },
  },
  "/api/auth/verify-reset-otp": {
    post: {
      summary: "Verify a password reset OTP before entering a new password",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email", "otp"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "thuong@example.com",
                },
                otp: {
                  type: "string",
                  example: "123456",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "OTP verified successfully",
        },
        400: {
          description: "Missing, invalid, or expired OTP",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
  "/api/auth/reset-password": {
    post: {
      summary: "Reset a password with a reset token or OTP",
      tags: ["Auth"],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              oneOf: [
                {
                  type: "object",
                  required: ["token", "newPassword"],
                  properties: {
                    token: {
                      type: "string",
                      example: "5f3d4d...",
                    },
                    newPassword: {
                      type: "string",
                      format: "password",
                      example: "newsecret123",
                    },
                  },
                },
                {
                  type: "object",
                  required: ["email", "otp", "newPassword"],
                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "thuong@example.com",
                    },
                    otp: {
                      type: "string",
                      example: "123456",
                    },
                    newPassword: {
                      type: "string",
                      format: "password",
                      example: "newsecret123",
                    },
                  },
                },
              ],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Password reset successfully",
        },
        400: {
          description: "Missing, invalid, or expired reset credential",
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
    delete: {
      summary: "Delete the current logged-in user's account",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Account deleted successfully",
        },
        400: {
          description: "Account cannot be deleted because linked data still exists or the final admin would be removed",
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
  "/api/users/me/notifications": {
    get: {
      summary: "Get the current logged-in user's notification preferences",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Notification preferences fetched successfully",
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
      summary: "Update the current logged-in user's notification preferences",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["notificationPreferences"],
              properties: {
                notificationPreferences: {
                  type: "object",
                  properties: {
                    expenseAdded: {
                      type: "boolean",
                      example: true,
                    },
                    paymentReceived: {
                      type: "boolean",
                      example: false,
                    },
                    settlementReminder: {
                      type: "boolean",
                      example: true,
                    },
                    weeklyDigest: {
                      type: "boolean",
                      example: false,
                    },
                    groupInvites: {
                      type: "boolean",
                      example: true,
                    },
                    marketingEmails: {
                      type: "boolean",
                      example: false,
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Notification preferences updated successfully",
        },
        400: {
          description: "Invalid notification preferences payload",
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
  "/api/users/me/billing": {
    get: {
      summary: "Get the current logged-in user's billing summary",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Billing summary fetched successfully",
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
      summary: "Update the current logged-in user's billing plan",
      tags: ["Users"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["plan"],
              properties: {
                plan: {
                  type: "string",
                  enum: ["free", "pro"],
                  example: "pro",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Billing plan updated successfully",
        },
        400: {
          description: "Missing or invalid billing plan payload",
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
  "/api/groups": {
    get: {
      summary: "Get groups for the current logged-in user",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Groups fetched successfully",
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
    post: {
      summary: "Create a new group",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "icon", "color"],
              properties: {
                name: {
                  type: "string",
                  example: "Summer Trip",
                },
                icon: {
                  type: "string",
                  example: "Plane",
                },
                color: {
                  type: "string",
                  example: "#16A34A",
                },
                members: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "email",
                  },
                  example: ["alex@gmail.com", "mia@gmail.com"],
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Group created successfully",
        },
        400: {
          description: "Missing or invalid group payload",
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
  "/api/groups/{groupId}": {
    get: {
      summary: "Get a single group for the current logged-in user",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "groupId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Group fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
    patch: {
      summary: "Update a group owned by the current logged-in user",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "groupId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "icon", "color"],
              properties: {
                name: {
                  type: "string",
                  example: "Summer Trip 2026",
                },
                icon: {
                  type: "string",
                  example: "🎉",
                },
                color: {
                  type: "string",
                  example: "#16A34A",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Group updated successfully",
        },
        400: {
          description: "Missing or invalid group payload",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
    delete: {
      summary: "Delete a group owned by the current logged-in user",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "groupId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Group deleted successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
        503: {
          description: "MongoDB connection failed",
        },
      },
    },
  },
  "/api/groups/{groupId}/members": {
    post: {
      summary: "Add a member to a group owned by the current logged-in user",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "groupId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["email"],
              properties: {
                email: {
                  type: "string",
                  format: "email",
                  example: "alex@gmail.com",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Member added successfully",
        },
        400: {
          description: "Missing or invalid member payload",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
      },
    },
  },
  "/api/groups/{groupId}/members/{memberId}": {
    delete: {
      summary: "Remove a member from a group owned by the current logged-in user",
      tags: ["Groups"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "groupId",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          in: "path",
          name: "memberId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Member removed successfully",
        },
        400: {
          description: "Invalid member removal request",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
      },
    },
  },
  "/api/expenses": {
    get: {
      summary: "Get expenses for the current logged-in user",
      tags: ["Expenses"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "query",
          name: "groupId",
          required: false,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Expenses fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
    post: {
      summary: "Create an expense for the current logged-in user",
      tags: ["Expenses"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["title", "category", "paidBy", "amount", "yourShare", "date"],
              properties: {
                title: {
                  type: "string",
                  example: "Team dinner",
                },
                category: {
                  type: "string",
                  example: "Food",
                },
                paidBy: {
                  type: "string",
                  example: "Jamie",
                },
                amount: {
                  type: "string",
                  example: "$120.00",
                },
                yourShare: {
                  type: "string",
                  example: "$30.00",
                },
                date: {
                  type: "string",
                  example: "Jun 22",
                },
                status: {
                  type: "string",
                  enum: ["Pending", "Settled"],
                  example: "Pending",
                },
                groupId: {
                  type: "string",
                  example: "6855abc1234567890def1234",
                },
                groupName: {
                  type: "string",
                  example: "Bali Trip 2026",
                },
                receiptId: {
                  type: "string",
                  example: "6855abc1234567890def5678",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Expense created successfully",
        },
        400: {
          description: "Missing or invalid expense payload",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User, group, or receipt not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
  },
  "/api/receipts/presign": {
    post: {
      summary: "Create a presigned S3 upload URL for a receipt file",
      tags: ["Receipts"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["originalFileName", "mimeType", "sizeInBytes"],
              properties: {
                originalFileName: {
                  type: "string",
                  example: "team-dinner-receipt.pdf",
                },
                mimeType: {
                  type: "string",
                  enum: ["image/jpeg", "image/png", "application/pdf"],
                  example: "application/pdf",
                },
                sizeInBytes: {
                  type: "integer",
                  example: 248120,
                },
                groupId: {
                  type: "string",
                  example: "6855abc1234567890def1234",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Presigned upload URL created successfully",
        },
        400: {
          description: "Missing or invalid receipt upload payload",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
        503: {
          description: "S3 configuration or backend service failed",
        },
      },
    },
  },
  "/api/receipts": {
    get: {
      summary: "Get receipt uploads for the current logged-in user",
      tags: ["Receipts"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Receipts fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
    post: {
      summary: "Store a receipt upload record after successful S3 upload",
      tags: ["Receipts"],
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: [
                "originalFileName",
                "storedFileName",
                "storagePath",
                "mimeType",
                "sizeInBytes",
              ],
              properties: {
                originalFileName: {
                  type: "string",
                  example: "team-dinner-receipt.pdf",
                },
                storedFileName: {
                  type: "string",
                  example: "1718950000-acde1234-team-dinner-receipt.pdf",
                },
                storagePath: {
                  type: "string",
                  example:
                    "receipts/6855abc1234567890def1234/2026/06/1718950000-acde1234-team-dinner-receipt.pdf",
                },
                mimeType: {
                  type: "string",
                  enum: ["image/jpeg", "image/png", "application/pdf"],
                  example: "application/pdf",
                },
                sizeInBytes: {
                  type: "integer",
                  example: 248120,
                },
                groupId: {
                  type: "string",
                  example: "6855abc1234567890def1234",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Receipt record stored successfully",
        },
        400: {
          description: "Missing or invalid receipt record payload",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or group not found",
        },
        503: {
          description: "MongoDB, S3 configuration, or backend service failed",
        },
      },
    },
  },
  "/api/receipts/{receiptId}": {
    get: {
      summary: "Get a single receipt upload for the current logged-in user",
      tags: ["Receipts"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "receiptId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Receipt fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or receipt not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
  },
  "/api/receipts/{receiptId}/view-url": {
    get: {
      summary: "Create a presigned S3 URL to view or download a receipt file",
      tags: ["Receipts"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "receiptId",
          required: true,
          schema: {
            type: "string",
          },
        },
        {
          in: "query",
          name: "download",
          required: false,
          schema: {
            type: "boolean",
          },
          description: "Set true to force attachment download instead of inline view.",
        },
      ],
      responses: {
        200: {
          description: "Presigned receipt access URL created successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        404: {
          description: "User or receipt not found",
        },
        503: {
          description: "S3 configuration, MongoDB, or backend service failed",
        },
      },
    },
  },
  "/api/admin/users": {
    get: {
      summary: "Get all users for admin management",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Admin users fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        403: {
          description: "Admin access required",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
  },
  "/api/admin/users/export": {
    get: {
      summary: "Export all admin user records as CSV",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "CSV export generated successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        403: {
          description: "Admin access required",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
  },
  "/api/admin/users/{userId}": {
    get: {
      summary: "Get admin detail for a specific user",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "Admin user fetched successfully",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        403: {
          description: "Admin access required",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
    patch: {
      summary: "Update a user's role from the admin area",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["role"],
              properties: {
                role: {
                  type: "string",
                  enum: ["admin", "user"],
                  example: "admin",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "User role updated successfully",
        },
        400: {
          description: "Invalid role or protected self-update attempt",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        403: {
          description: "Admin access required",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
    delete: {
      summary: "Delete a user from the admin area when no linked data remains",
      tags: ["Admin"],
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: "path",
          name: "userId",
          required: true,
          schema: {
            type: "string",
          },
        },
      ],
      responses: {
        200: {
          description: "User deleted successfully",
        },
        400: {
          description: "Protected user or linked data still exists",
        },
        401: {
          description: "Missing or invalid bearer token",
        },
        403: {
          description: "Admin access required",
        },
        404: {
          description: "User not found",
        },
        503: {
          description: "MongoDB or backend service failed",
        },
      },
    },
  },
};

export default swaggerSpec;
