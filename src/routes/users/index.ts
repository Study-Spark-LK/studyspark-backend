import { createHonoApp } from '@/lib/create-app';
import createRoute from '@/routes/users/routes/create';
import updateRoute from '@/routes/users/routes/update';

const app = createHonoApp();

app.route('/', createRoute);
app.route('/update', updateRoute);

export default app;
