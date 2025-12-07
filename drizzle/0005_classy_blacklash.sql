CREATE TABLE `user_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('monitoring','testing','analysis','communication') NOT NULL,
	`tags` json,
	`difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'intermediate',
	`parameters` json NOT NULL,
	`command` text NOT NULL,
	`useCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_templates_id` PRIMARY KEY(`id`)
);
