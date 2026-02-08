import { createHonoApp } from '@/lib/create-app';
import createRoute from '@/routes/library/routes/create';
import listRoute from '@/routes/library/routes/list';

const app = createHonoApp();

app.route('/', listRoute);
app.route('/', createRoute);

export default app;
