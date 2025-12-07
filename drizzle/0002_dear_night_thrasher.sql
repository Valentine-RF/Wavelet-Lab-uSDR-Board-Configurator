ALTER TABLE `device_configs` MODIFY COLUMN `rxCenterFreq` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `device_configs` MODIFY COLUMN `txCenterFreq` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `device_configs` MODIFY COLUMN `rxBandwidth` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `device_configs` MODIFY COLUMN `txBandwidth` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `device_configs` MODIFY COLUMN `externalClockFreq` varchar(20);--> statement-breakpoint
ALTER TABLE `device_configs` MODIFY COLUMN `sampleRate` varchar(20) NOT NULL;