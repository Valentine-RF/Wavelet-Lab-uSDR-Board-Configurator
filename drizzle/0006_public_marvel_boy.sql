CREATE TABLE `template_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`templateId` varchar(255),
	`userTemplateId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_favorites_id` PRIMARY KEY(`id`)
);
