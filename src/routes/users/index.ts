import { Hono } from 'hono';
import createRoute from './routes/create';

const userApp = new Hono().route('/', createRoute);

export default userApp;


