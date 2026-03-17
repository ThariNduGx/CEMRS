-- database.sql
-- Run this script in your MySQL instance to create the necessary tables

CREATE DATABASE IF NOT EXISTS `cida_machinery`;
USE `cida_machinery`;

-- Table structure for Contractors
CREATE TABLE IF NOT EXISTS `contractors` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `full_name` VARCHAR(100) NOT NULL,
  `company_name` VARCHAR(150) NOT NULL,
  `cida_number` VARCHAR(50) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `contact_details` VARCHAR(50) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table structure for Rentals (Mocking machine references from localStorage)
CREATE TABLE IF NOT EXISTS `rentals` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `contractor_id` INT(11) NOT NULL,
  `machine_id` VARCHAR(100) NOT NULL, -- Relates to localStorage machine ID
  `status` ENUM('requested', 'approved', 'completed', 'rejected') DEFAULT 'requested',
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`contractor_id`) REFERENCES `contractors`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
