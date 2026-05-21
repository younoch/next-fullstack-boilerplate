import { NextResponse } from "next/server";

const spec = {
  openapi: "3.0.0",
  info: {
    title: "Next Fullstack Boilerplate API",
    version: "0.1.0",
    description: "API documentation for the Next.js fullstack boilerplate",
  },
  paths: {
    "/api/user": {
      post: {
        summary: "Create a test user",
        description: "Creates a new user with a random email in the database",
        responses: {
          "200": {
            description: "The newly created user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "Database error",
          },
        },
      },
    },
    "/api/test-queue": {
      get: {
        summary: "Send a test message to the queue",
        description: "Publishes a test task message to RabbitMQ",
        responses: {
          "200": {
            description: "Message sent successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "500": {
            description: "RabbitMQ error",
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
