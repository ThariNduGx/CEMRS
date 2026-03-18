-- ============================================================
-- CEMRS - Construction Equipment & Machinery Registration System
-- MySQL Setup Script for XAMPP
-- Updated: Priority 5 — ENUM status, FK constraints, contractor specialization
-- ============================================================
-- HOW TO USE:
--   1. Open XAMPP Control Panel and start Apache + MySQL
--   2. Open phpMyAdmin at http://localhost/phpmyadmin
--   3. Click "Import" tab, select this file, and click Go
--   OR run via command line:
--      mysql -u root -p < database.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `cida_machinery` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `cida_machinery`;

-- ----------------------------------------------------------
-- Table: users
-- Central user table. Stores all roles including contractors.
-- Contractors are a specialization of this entity (Priority 2).
-- Passwords are bcrypt-hashed. Demo seed data is inserted by
-- the Node server on first startup if the table is empty.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`              VARCHAR(50)   NOT NULL,
  `name`            VARCHAR(100)  NOT NULL,
  `company_name`    VARCHAR(150)  DEFAULT NULL,
  `email`           VARCHAR(150)  NOT NULL UNIQUE,
  `password`        VARCHAR(255)  NOT NULL,
  `role`            ENUM('admin', 'director_general', 'owner', 'contractor') NOT NULL,
  `contact_details` VARCHAR(50)   DEFAULT '',
  `address`         TEXT          DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: contractors
-- Extended profile for users with role='contractor'.
-- user_id is a FK to users(id) — Priority 2 specialization.
-- Accounts start as 'pending' and must be approved by a CIDA
-- admin before the contractor can log in.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contractors` (
  `id`              INT(11)       NOT NULL AUTO_INCREMENT,
  `user_id`         VARCHAR(50)   DEFAULT NULL,
  `full_name`       VARCHAR(100)  NOT NULL,
  `company_name`    VARCHAR(150)  NOT NULL,
  `cida_number`     VARCHAR(50)   NOT NULL,
  `email`           VARCHAR(150)  NOT NULL UNIQUE,
  `password`        VARCHAR(255)  NOT NULL,
  `contact_details` VARCHAR(50)   NOT NULL,
  `status`          ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: rentals
-- Rental requests submitted by approved contractors.
-- machine_id references a machinery.id value.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rentals` (
  `id`            INT(11)      NOT NULL AUTO_INCREMENT,
  `contractor_id` INT(11)      NOT NULL,
  `machine_id`    VARCHAR(100) NOT NULL,
  `status`        ENUM('requested', 'approved', 'completed', 'rejected') DEFAULT 'requested',
  `start_date`    DATE         NOT NULL,
  `end_date`      DATE         NOT NULL,
  `created_at`    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: machinery
-- Equipment registration lifecycle.
-- status uses ENUM (Priority 5) — admin_approved is the
-- intermediate state after Admin review and before DG
-- certification (Priority 3 two-step workflow).
-- documents and appeal are stored as JSON.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `machinery` (
  `id`                   VARCHAR(50)   NOT NULL,
  `owner_id`             VARCHAR(50)   NOT NULL,
  `type`                 VARCHAR(20)   NOT NULL,
  `make_model`           VARCHAR(150)  NOT NULL,
  `country_of_origin`    VARCHAR(100)  DEFAULT '',
  `location`             VARCHAR(150)  DEFAULT '',
  `status`               ENUM('pending','admin_approved','approved','rejected','revoked','pending_renewal') DEFAULT 'pending',
  `registration_number`  VARCHAR(50)   DEFAULT NULL,
  `registration_date`    BIGINT        DEFAULT NULL,
  `expiry_date`          BIGINT        DEFAULT NULL,
  `rejection_reason`     TEXT          DEFAULT '',
  `fee_at_submission`    INT           DEFAULT 0,
  `renewal_count`        INT           DEFAULT 0,
  `renewal_requested_at` BIGINT        DEFAULT NULL,
  `certificate_issued_at` BIGINT       DEFAULT NULL,
  `submitted_at`         BIGINT        DEFAULT NULL,
  `documents`            JSON          DEFAULT NULL,
  `appeal`               JSON          DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: maintenance
-- Equipment maintenance records.
-- owner_id has a proper FK constraint (Priority 5).
-- documents is stored as JSON.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `maintenance` (
  `id`               VARCHAR(50)   NOT NULL,
  `owner_id`         VARCHAR(50)   DEFAULT NULL,
  `equipment_id`     VARCHAR(100)  NOT NULL,
  `equipment_name`   VARCHAR(150)  NOT NULL,
  `maintenance_date` VARCHAR(10)   NOT NULL,
  `status`           VARCHAR(30)   DEFAULT 'scheduled',
  `maintenance_type` VARCHAR(20)   DEFAULT 'service',
  `location`         VARCHAR(150)  DEFAULT '',
  `site`             VARCHAR(150)  DEFAULT '',
  `documents`        JSON          DEFAULT NULL,
  `created_at`       BIGINT        DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
