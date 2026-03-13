import { setupGetUserProfileRoute } from '@/routes/internal/routes/get-user-profile';
import { setupUpdateUserProfileRoute } from '@/routes/internal/routes/update-user-profile';

export function setupInternalRoutes() {
	setupGetUserProfileRoute();
	setupUpdateUserProfileRoute();
}
