const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth API",
      version: "1.0.0",
      description: "Node.js Authentication API with JWT and MySQL",
    },
    servers: [
      {
        url: "http://localhost:5001", // ✅ Ensure this matches your running server
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"], // ✅ Ensure this points to your routes folder
};

const swaggerDocs = swaggerJsdoc(options);
module.exports = swaggerDocs;
