CREATE TABLE `command_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`command` text NOT NULL,
	`executionMethod` enum('terminal','copy','stream') NOT NULL,
	`configuration` json,
	`mode` enum('rx','tx','trx') NOT NULL,
	`rfPath` varchar(64),
	`centerFrequency` varchar(20),
	`sampleRate` varchar(20),
	`success` boolean NOT NULL DEFAULT true,
	`errorMessage` text,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `command_history_id` PRIMARY KEY(`id`)
);
