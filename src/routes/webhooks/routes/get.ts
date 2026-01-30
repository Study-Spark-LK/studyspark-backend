import { createHonoApp } from "@/lib/create-app";

const app = createHonoApp();

app.get('/', (c) => c.text('webhook is running'));
