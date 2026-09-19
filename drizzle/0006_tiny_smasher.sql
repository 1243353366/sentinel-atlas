CREATE TABLE `investigation_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`objective` text NOT NULL,
	`constraints` text NOT NULL,
	`status` enum('planned','running','completed','blocked') NOT NULL,
	`conclusion` text NOT NULL,
	`confidence` enum('SUPPORTED','CANDIDATE','UNMAPPED','RESTRICTED') NOT NULL,
	`evidenceCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigation_cases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `investigation_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`sequence` int NOT NULL,
	`action` varchar(120) NOT NULL,
	`detail` text NOT NULL,
	`authority` enum('ALLOW','GUARDED','APPROVAL REQUIRED','DENIED') NOT NULL,
	`outcome` varchar(120) NOT NULL,
	`evidenceJson` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `investigation_events_id` PRIMARY KEY(`id`)
);
