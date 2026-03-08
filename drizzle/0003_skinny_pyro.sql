CREATE TABLE `documents` (
	`material_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_id` text NOT NULL,
	`status` text DEFAULT 'PENDING',
	`title` text,
	`description` text,
	`subject` text DEFAULT 'General',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`profile_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` text PRIMARY KEY NOT NULL,
	`clerkId` text NOT NULL,
	`docId` text,
	`type` text DEFAULT 'PENDING',
	`mimeType` text NOT NULL,
	`fileName` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`clerkId`) REFERENCES `users`(`user_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`docId`) REFERENCES `documents`(`material_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `file_id_unique` ON `file` (`id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`qna` text NOT NULL,
	`status` text DEFAULT 'PENDING',
	`visual_score` integer DEFAULT -1,
	`auditory_score` integer DEFAULT -1,
	`reading_score` integer DEFAULT -1,
	`kinesthetic_score` integer DEFAULT -1,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
DROP TABLE `learning_profiles`;--> statement-breakpoint
DROP TABLE `study_materials`;--> statement-breakpoint
ALTER TABLE `users` ADD `createdAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `updatedAt` integer NOT NULL;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `email`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `full_name`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `updated_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `created_at`;--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `deleted_at`;