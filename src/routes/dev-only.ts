import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';

/*
 THIS IS FOR DEV-ONLY ROUTES.
 function is required on this route for openAPIRouteHandler to work.
 it only works on the same app instance.
 */

export function setupDevOnlyRoute(
	app: OpenAPIHono<{
		Bindings: AppEnv;
		Variables: ContextVariables;
	}>
) {
	app.use('/dev/*', async (c, next) => {
		const { ENVIRONMENT } = c.env;
		const IS_DEV = ENVIRONMENT === 'development';

		if (IS_DEV) {
			await next();
		} else {
			return c.text('404 Not Found', 404);
		}
	});

	app.doc('/dev/openapi', {
        openapi: '3.0.0',
        info: {
            title: 'StudySpark Internal API',
            version: '1.0.0'
        },
        security: [{ Bearer: [] }],
        servers: [
            {
                url: 'http://localhost:8787',
                description: 'Local Server (Wrangler)'
            }
        ]
    });

	app.get(
		'/dev/docs',
		swaggerUI({
			title: 'StudySpark Internal API',
			url: '/dev/openapi',
			manuallySwaggerUIHtml: (asset) => `
              <html lang="en">
                    <head>
                      <meta charset="utf-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1" />
                      <title>API Docs</title>
                      <style>
                        /* Example dark mode override */
                        @media (prefers-color-scheme: dark) {
                          body {
                            background-color: #111;
                            color: #eee;
                          }
                          .swagger-ui {
                            filter: invert(90%) hue-rotate(180deg);
                          }
                          .swagger-ui .microlight {
                            filter: invert(100%) hue-rotate(180deg);
                          }
                          /* More fine-grained overrides might be needed */
                        }

                        /* You can also always force dark theme */
                        /* body { background: #020617; color: #e2e8f0; } */
                        /* override colors of buttons, .opblock, etc */
                      </style>
                    </head>
                    <body>
                      <div>
                        <div id="swagger-ui"></div>
                        ${asset.css.map(
				(url) => `<link rel="stylesheet" href="${url}" />`
			)}
                        ${asset.js.map(
				(url) =>
					`<script src="${url}" crossorigin="anonymous"></script>`
			)}
                        <script>
                          window.onload = () => {
                            window.ui = SwaggerUIBundle({
                              dom_id: '#swagger-ui',
                              url: '/dev/openapi',
                            })
                          }
                        </script>
                      </div>
                    </body>
              </html>
              `
		})
	);
	app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your Clerk JWT token here'
    });
}
