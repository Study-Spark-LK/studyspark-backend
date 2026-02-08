import { createHonoApp } from '@/lib/create-app';
import createRoute from '@/routes/users/routes/create';
import updateRoute from '@/routes/users/routes/update';
import meRoute from './routes/me';

const app = createHonoApp();

app.route('/', meRoute);
app.route('/', createRoute);
app.route('/update', updateRoute);

export default app;
