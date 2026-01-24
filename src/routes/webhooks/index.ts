import { Hono } from 'hono';
import clerkWebhookRoute from './routes/clerk';
import getclerkWebhookRoute from './routes/get';

const webhookApp = new Hono().route('/clerk', clerkWebhookRoute).route('/get', getclerkWebhookRoute);

export default webhookApp;
