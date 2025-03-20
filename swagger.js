import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Minha API',
            version: '1.0.0',
            description: 'Documentação da API',
        },
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
