CREATE TABLE `observatory_entities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`entityType` varchar(64) NOT NULL,
	`canonicalName` varchar(180) NOT NULL,
	`aliases` text NOT NULL,
	`metadata` text NOT NULL,
	`confidence` enum('low','medium','high') NOT NULL,
	`verificationStatus` enum('unverified','reviewed','verified') NOT NULL DEFAULT 'unverified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `observatory_entities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observatory_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`observationId` int,
	`evidenceType` enum('FACT','OBSERVATION','INFERENCE','HYPOTHESIS','ATTRIBUTION','VERIFIED_CLAIM') NOT NULL,
	`statement` text NOT NULL,
	`provenance` text NOT NULL,
	`confidence` enum('low','medium','high') NOT NULL,
	`verificationStatus` enum('unverified','reviewed','verified') NOT NULL DEFAULT 'unverified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `observatory_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observatory_observations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceId` int,
	`observationType` varchar(120) NOT NULL,
	`observedAt` timestamp,
	`rawData` text NOT NULL,
	`normalizedData` text NOT NULL,
	`confidence` enum('low','medium','high') NOT NULL,
	`verificationStatus` enum('unverified','reviewed','verified') NOT NULL DEFAULT 'unverified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `observatory_observations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observatory_relationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromEntityId` int NOT NULL,
	`toEntityId` int NOT NULL,
	`relationshipType` varchar(80) NOT NULL,
	`relationshipClass` enum('deterministic','observed','inferred','probabilistic','hypothesized','attributed') NOT NULL,
	`sourceId` int,
	`evidenceId` int,
	`confidence` enum('low','medium','high') NOT NULL,
	`verificationStatus` enum('unverified','reviewed','verified') NOT NULL DEFAULT 'unverified',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `observatory_relationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `observatory_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(180) NOT NULL,
	`type` varchar(64) NOT NULL,
	`provider` varchar(180) NOT NULL,
	`url` text,
	`trustLevel` enum('unrated','low','medium','high') NOT NULL DEFAULT 'unrated',
	`collectionMethod` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `observatory_sources_id` PRIMARY KEY(`id`)
);
