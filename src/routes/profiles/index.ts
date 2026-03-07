import { setupGetProfilesRoute } from '@/routes/profiles/routes/get-profiles';
import { setupCreateProfileRoute } from '@/routes/profiles/routes/create-profile';
import { setupDeleteProfileRoute } from '@/routes/profiles/routes/delete-profile';

export function setupProfileRoutes() {
	setupGetProfilesRoute();
	setupCreateProfileRoute();
	setupDeleteProfileRoute();
}
