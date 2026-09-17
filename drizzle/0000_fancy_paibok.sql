CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant` text NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`location` text NOT NULL,
	`status` text NOT NULL,
	`priority` text NOT NULL,
	`author` text NOT NULL,
	`assigned` text NOT NULL,
	`day` text NOT NULL,
	`start` integer NOT NULL,
	`end` integer NOT NULL,
	`area` text NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	`history` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_entries_tenant_kind` ON `entries` (`tenant`,`kind`);--> statement-breakpoint
CREATE TABLE `slots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tenant` text NOT NULL,
	`area` text NOT NULL,
	`day` text NOT NULL,
	`hour` integer NOT NULL,
	`entry_id` text NOT NULL,
	FOREIGN KEY (`entry_id`) REFERENCES `entries`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `unique_area_hour` ON `slots` (`tenant`,`area`,`day`,`hour`);--> statement-breakpoint
CREATE INDEX `idx_slots_entry` ON `slots` (`entry_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL
);
