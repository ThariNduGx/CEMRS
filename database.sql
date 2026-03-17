-- ============================================================
-- CEMRS - Construction Equipment & Machinery Registration System
-- MySQL Setup Script for XAMPP
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
-- Table: contractors
-- Stores contractor registrations. Accounts start as 'pending'
-- and must be approved by a CIDA admin before login is allowed.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contractors` (
  `id`              INT(11)       NOT NULL AUTO_INCREMENT,
  `full_name`       VARCHAR(100)  NOT NULL,
  `company_name`    VARCHAR(150)  NOT NULL,
  `cida_number`     VARCHAR(50)   NOT NULL,
  `email`           VARCHAR(150)  NOT NULL UNIQUE,
  `password`        VARCHAR(255)  NOT NULL,
  `contact_details` VARCHAR(50)   NOT NULL,
  `status`          ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at`      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------
-- Table: rentals
-- Stores rental requests submitted by approved contractors.
-- machine_id references the equipment ID stored in the app.
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
