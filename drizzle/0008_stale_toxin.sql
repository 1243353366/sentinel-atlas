CREATE TABLE `release_trust_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`eventType` enum('remote_hash_lookup','release_attestation') NOT NULL,
	`provider` varchar(120) NOT NULL,
	`outcome` enum('known','not_found','flagged','unavailable','verified') NOT NULL,
	`digestAlgorithm` varchar(24) NOT NULL DEFAULT 'SHA-256',
	`consentGranted` int NOT NULL DEFAULT 0,
	`fileUploaded` int NOT NULL DEFAULT 0,
	`details` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `release_trust_events_id` PRIMARY KEY(`id`)
);
