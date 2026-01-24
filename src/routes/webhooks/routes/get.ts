import { Hono} from 'hono';

const app = new Hono();

app.get('/', (c) => c.text('webhook is Running'));

export default app;



