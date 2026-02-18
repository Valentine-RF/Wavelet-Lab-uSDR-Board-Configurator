-- Add foreign key constraints that were missing from auto-generated migrations
-- These enforce referential integrity and cascade deletes at the database level

-- device_configs → users
ALTER TABLE `device_configs`
  ADD CONSTRAINT `device_configs_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- device_status_log → users, device_configs
ALTER TABLE `device_status_log`
  ADD CONSTRAINT `device_status_log_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `device_status_log`
  ADD CONSTRAINT `device_status_log_configId_device_configs_id_fk`
  FOREIGN KEY (`configId`) REFERENCES `device_configs`(`id`) ON DELETE SET NULL;

-- streaming_sessions → users, device_configs
ALTER TABLE `streaming_sessions`
  ADD CONSTRAINT `streaming_sessions_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `streaming_sessions`
  ADD CONSTRAINT `streaming_sessions_configId_device_configs_id_fk`
  FOREIGN KEY (`configId`) REFERENCES `device_configs`(`id`) ON DELETE SET NULL;

-- command_history → users
ALTER TABLE `command_history`
  ADD CONSTRAINT `command_history_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- user_templates → users
ALTER TABLE `user_templates`
  ADD CONSTRAINT `user_templates_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

-- template_favorites → users, user_templates
ALTER TABLE `template_favorites`
  ADD CONSTRAINT `template_favorites_userId_users_id_fk`
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE;

ALTER TABLE `template_favorites`
  ADD CONSTRAINT `template_favorites_userTemplateId_user_templates_id_fk`
  FOREIGN KEY (`userTemplateId`) REFERENCES `user_templates`(`id`) ON DELETE CASCADE;

-- Add indexes defined in schema.ts but missing from migrations
CREATE INDEX `device_configs_userId_idx` ON `device_configs` (`userId`);
CREATE INDEX `device_status_log_userId_idx` ON `device_status_log` (`userId`);
CREATE INDEX `device_status_log_timestamp_idx` ON `device_status_log` (`timestamp`);
CREATE INDEX `streaming_sessions_userId_idx` ON `streaming_sessions` (`userId`);
CREATE INDEX `streaming_sessions_status_idx` ON `streaming_sessions` (`status`);
CREATE INDEX `command_history_userId_idx` ON `command_history` (`userId`);
CREATE INDEX `command_history_executedAt_idx` ON `command_history` (`executedAt`);
CREATE INDEX `user_templates_userId_idx` ON `user_templates` (`userId`);
CREATE INDEX `user_templates_category_idx` ON `user_templates` (`category`);
CREATE INDEX `template_favorites_userId_idx` ON `template_favorites` (`userId`);
