export enum APIErrorCodes {
	INPUT_VALIDATION_ERROR = 'input_validation_error',
	AUTHENTICATION_REQUIRED = 'authentication_required',
	// ----------- PROFILES ------------
	PROFILE_NOT_FOUND = 'profile-not-found',
	PROFILE_NOT_READY = 'profile-not-ready',
	// ----------- DOCS ------------
	DOCUMENT_NOT_FOUND = 'document-not-found',
	// ----------- FILES ------------
	INVALID_FILE = 'invalid_file',
	FILE_NOT_FOUND = 'file_not_found',
	FILE_TOO_LARGE = 'file_too_large',
	// ----------- Unknown ------------
	UNKNOWN_ERROR = 'unknown error'
}
