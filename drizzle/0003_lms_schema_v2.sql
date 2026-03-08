CREATE TABLE `documents` (
	`material_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`profile_id` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'PENDING',
	`title` text,
	`description` text,
	`category` text DEFAULT 'General',
	`progressPercentage` real DEFAULT -1,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`profile_id`) REFERENCES `profiles`(`profile_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `file` (
	`id` text PRIMARY KEY NOT NULL,
	`clerkId` text NOT NULL,
	`docId` text,
	`type` text DEFAULT 'PENDING',
	`mimeType` text NOT NULL,
	`fileName` text,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`clerkId`) REFERENCES `users`(`user_id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`docId`) REFERENCES `documents`(`material_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `file_id_unique` ON `file` (`id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`qna` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'PENDING',
	`visual_score` integer DEFAULT -1,
	`auditory_score` integer DEFAULT -1,
	`reading_score` integer DEFAULT -1,
	`kinesthetic_score` integer DEFAULT -1,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
DROP TABLE `learning_profiles`;--> statement-breakpoint
DROP TABLE `study_materials`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`user_id` text PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("user_id", "createdAt", "updatedAt") SELECT "user_id", "createdAt", "updatedAt" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;