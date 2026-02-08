PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_learning_profiles` (
	`profile_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`visual_score` integer DEFAULT 0,
	`auditory_score` integer DEFAULT 0,
	`reading_score` integer DEFAULT 0,
	`kinesthetic_score` integer DEFAULT 0,
	`learning_style` text,
	`hobbies` text,
	`updated_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_learning_profiles`("profile_id", "user_id", "visual_score", "auditory_score", "reading_score", "kinesthetic_score", "learning_style", "hobbies", "updated_at", "created_at", "deleted_at") SELECT "profile_id", "user_id", "visual_score", "auditory_score", "reading_score", "kinesthetic_score", "learning_style", "hobbies", "updated_at", "created_at", "deleted_at" FROM `learning_profiles`;--> statement-breakpoint
DROP TABLE `learning_profiles`;--> statement-breakpoint
ALTER TABLE `__new_learning_profiles` RENAME TO `learning_profiles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_study_materials` (
	`material_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`file_url` text NOT NULL,
	`file_type` text NOT NULL,
	`subject` text DEFAULT 'General',
	`summary` text,
	`is_favorite` integer DEFAULT false,
	`updated_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_study_materials`("material_id", "user_id", "title", "description", "file_url", "file_type", "subject", "summary", "is_favorite", "updated_at", "created_at", "deleted_at") SELECT "material_id", "user_id", "title", "description", "file_url", "file_type", "subject", "summary", "is_favorite", "updated_at", "created_at", "deleted_at" FROM `study_materials`;--> statement-breakpoint
DROP TABLE `study_materials`;--> statement-breakpoint
ALTER TABLE `__new_study_materials` RENAME TO `study_materials`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`updated_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`deleted_at` text
);
--> statement-breakpoint
INSERT INTO `__new_users`("user_id", "email", "full_name", "updated_at", "created_at", "deleted_at") SELECT "user_id", "email", "full_name", "updated_at", "created_at", "deleted_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;