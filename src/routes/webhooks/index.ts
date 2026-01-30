import { createHonoApp } from '@/lib/create-app';
import clerkRoute from './routes/clerk';

const app = createHonoApp();

app.route('/clerk', clerkRoute);

export default app;
