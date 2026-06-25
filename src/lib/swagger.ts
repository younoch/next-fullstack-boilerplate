import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pacutax Async Engine - Enterprise API Docs",
      version: "1.0.0",
      description: "Modular Monolith Multi-Country Tax Processing Core Layout",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Docker Development Server",
      },
    ],
    components: {
      schemas: {},
    },
  },
  apis: ["src/app/api/**/*.ts", "src/pages/api/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);