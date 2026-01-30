import app from './routes';
import { Bindings } from './types';

export default {
	fetch: app.fetch,
} satisfies ExportedHandler<Bindings>;
