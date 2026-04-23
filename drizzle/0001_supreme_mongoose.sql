CREATE TABLE `field_stage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `field` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`crop_type` text NOT NULL,
	`planting_date` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`current_stage` integer NOT NULL,
	`field_agent_id` text,
	FOREIGN KEY (`current_stage`) REFERENCES `field_stage`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`field_agent_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`observation` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`field_id` integer NOT NULL,
	FOREIGN KEY (`field_id`) REFERENCES `field`(`id`) ON UPDATE no action ON DELETE cascade
);
