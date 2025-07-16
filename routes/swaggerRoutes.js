const express = require("express");
const YAML = require("yamljs");
const swaggerUi = require("swagger-ui-express");
const path = require("path");

// Import the OpenAPI document
const openApiDocument = YAML.load(
  path.join(__dirname, "..", "openapi.yaml")
);

// Create an Express router for Swagger documentation
const router = express.Router();

// Serve the Swagger UI
router.use("/", swaggerUi.serve);
router.get(
  "/",
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
      docExpansion: "none", // or 'list' or 'full'
      filter: true,
      showRequestHeaders: false,
      showCommonExtensions: true,
    },
  })
);

module.exports = router;
