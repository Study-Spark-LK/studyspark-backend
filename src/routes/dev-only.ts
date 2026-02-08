import { createHonoApp } from '@/lib/create-app';
import { swaggerUI } from '@hono/swagger-ui';

const app = createHonoApp();

// guard - only allow in development
app.use('*', async (c, next) => {
	if (c.env.ENVIRONMENT !== 'development') {
		return c.notFound();
	}
	await next();
});

// serve ui
app.get(
	'/',
	swaggerUI({
		url: '/doc',
		manuallySwaggerUIHtml: (asset) => `
              <html lang="en">
                    <head>
                      <meta charset="utf-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1" />
                      <title>API Docs</title>
                      <style>
                        /* dark mode override */
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
                        }

                      </style>
                    </head>
                    <body>
                      <div>
                        <div id="swagger-ui"></div>
                        ${asset.css.map((url) => `<link rel="stylesheet" href="${url}" />`)}
                        ${asset.js.map((url) => `<script src="${url}" crossorigin="anonymous"></script>`)}
                        <script>
                          window.onload = () => {
                            window.ui = SwaggerUIBundle({
                              dom_id: '#swagger-ui',
                              url: '/doc',
                            })
                          }
                        </script>
                      </div>
                    </body>
              </html>
              `,
	}),
);

export default app;
