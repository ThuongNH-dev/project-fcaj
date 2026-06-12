declare module "swagger-jsdoc" {
  interface SwaggerDefinition {
    openapi: string;
    info: {
      title: string;
      version: string;
      description?: string;
    };
    servers?: Array<{
      url: string;
      description?: string;
    }>;
  }

  interface SwaggerJSDocOptions {
    definition: SwaggerDefinition;
    apis: string[];
  }

  export default function swaggerJSDoc(options: SwaggerJSDocOptions): {
    openapi?: string;
    info?: SwaggerDefinition["info"];
    servers?: SwaggerDefinition["servers"];
    paths?: Record<string, unknown>;
    components?: Record<string, unknown>;
    tags?: unknown[];
  };
}
