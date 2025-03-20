import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FixHub API',
            version: '1.0.0',
            description: 'API para gerenciamento de manutenções',
        },
    },
    apis: ['./src/route/*.js'], // Certifique-se de que as rotas estão nesse caminho
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app) {
    console.log("⚡ Configurando Swagger em /docs...");
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
