CREATE TABLE `learning_profiles` (
	`profile_id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`visual_score` integer DEFAULT 0,
	`auditory_score` integer DEFAULT 0,
	`reading_score` integer DEFAULT 0,
	`kinesthetic_score` integer DEFAULT 0,
	`learning_style` text,
	`hobbies` text,
	`updated_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE `users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`full_name` text,
	`updated_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`deleted_at` integer
);
