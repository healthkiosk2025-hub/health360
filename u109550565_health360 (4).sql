-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 21, 2025 at 07:34 AM
-- Server version: 10.11.10-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u109550565_health360`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `admin_id` varchar(10) DEFAULT NULL,
  `name` varchar(30) DEFAULT NULL,
  `aadhaar_no` varchar(12) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `contact` varchar(10) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `panchayat_id` varchar(10) DEFAULT NULL,
  `role` varchar(10) DEFAULT NULL,
  `created_at` varchar(32) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`admin_id`, `name`, `aadhaar_no`, `email`, `contact`, `password`, `panchayat_id`, `role`, `created_at`, `updated_at`) VALUES
('ADM001', 'abc', '123456789012', 'xyz@gmail.com', '8888888888', '$2b$12$3ylNGe36N.wrRcUrczqm5eblOhGLeJCUkKajucQx1jNtcW3fbUKYG', 'PAN001', '', '2025-06-26T05:31:22.396000+00:00', '2025-07-02T07:13:43.476000+00:00'),
('ADM002', 'xyz', '111111111111', 'kds@gmail.com', '2222222222', '$2b$10$l1Q6RvhSZr1A/V66FfbNs.s7sUv14ymka8nhnnCZNus0HeZW6sKd6', 'PAN002', 'admin', '2025-06-27T06:14:28.445000+00:00', '2025-07-04T06:43:27.440000+00:00'),
('ADM003', 'yzx', '222222222222', 'kar@gmail.com', '3333333333', '$2b$10$L2LmgDrsajjAGhpU7Zwi0OmQXf15eo6em41ORTep6Uc9DsIZ5D.ri', 'PAN002', 'admin', '2025-06-29T07:33:50.379000+00:00', '2025-07-02T07:14:07.742000+00:00');

-- --------------------------------------------------------

--
-- Table structure for table `children`
--

CREATE TABLE `children` (
  `child_id` varchar(10) DEFAULT NULL,
  `name` varchar(30) DEFAULT NULL,
  `age` varchar(3) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `aadhaar_no` varchar(12) DEFAULT NULL,
  `mother_id` varchar(10) DEFAULT NULL,
  `admin_id` varchar(10) DEFAULT NULL,
  `created_at` varchar(32) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL,
  `dob` varchar(32) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `children`
--

INSERT INTO `children` (`child_id`, `name`, `age`, `email`, `aadhaar_no`, `mother_id`, `admin_id`, `created_at`, `updated_at`, `dob`, `password`) VALUES
('CHD001', 'shivam kumar', '15', 'prathamgarg975@gmail.com', '123456789013', 'MTH001', 'ADM001', '2025-06-23T05:24:24.878000+00:00', '2025-06-30T06:52:08.357000+00:00', NULL, NULL),
('CHD002', 'karan', '23', 'karandeepcsc@gmail.com', '111111111122', 'MTH002', 'ADM002', '2025-06-26T07:35:42.443000+00:00', '2025-06-27T10:21:00.048000+00:00', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `children_health_data`
--

CREATE TABLE `children_health_data` (
  `child_id` varchar(10) DEFAULT NULL,
  `date` varchar(32) DEFAULT NULL,
  `temperature` varchar(10) DEFAULT NULL,
  `height` varchar(10) DEFAULT NULL,
  `weight` varchar(10) DEFAULT NULL,
  `spo2` varchar(10) DEFAULT NULL,
  `pulse` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `children_health_data`
--

INSERT INTO `children_health_data` (`child_id`, `date`, `temperature`, `height`, `weight`, `spo2`, `pulse`) VALUES
('CHD001', '2025-06-20', '36.6', '85', '10', '98', '80');

-- --------------------------------------------------------

--
-- Table structure for table `children_vaccination`
--

CREATE TABLE `children_vaccination` (
  `child_id` varchar(10) DEFAULT NULL,
  `vaccine` varchar(15) DEFAULT NULL,
  `date_schedule` varchar(32) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `mothers`
--

CREATE TABLE `mothers` (
  `mother_id` varchar(10) DEFAULT NULL,
  `name` varchar(30) DEFAULT NULL,
  `age` varchar(3) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `dob` varchar(32) DEFAULT NULL,
  `hus_name` varchar(30) DEFAULT NULL,
  `bank_name` varchar(30) DEFAULT NULL,
  `account_no` varchar(30) DEFAULT NULL,
  `ifsc_code` varchar(15) DEFAULT NULL,
  `aadhaar_no` varchar(12) DEFAULT NULL,
  `mobile` varchar(10) DEFAULT NULL,
  `admin_id` varchar(10) DEFAULT NULL,
  `created_date` varchar(32) DEFAULT NULL,
  `created_at` varchar(32) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL,
  `lmp_date` varchar(32) DEFAULT NULL,
  `delivery_expected` date DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `mothers`
--

INSERT INTO `mothers` (`mother_id`, `name`, `age`, `email`, `phone`, `dob`, `hus_name`, `bank_name`, `account_no`, `ifsc_code`, `aadhaar_no`, `mobile`, `admin_id`, `created_date`, `created_at`, `updated_at`, `lmp_date`, `delivery_expected`, `password`) VALUES
('MTH001', 'Seema', '22', 'kumarprathamgarg@gmail.com', '7987979769', '2003-02-12', 'Rakesh Kumar', 'Punjab National Bank', '123456789123', 'PUNB0445500', '123456789014', '9465752400', 'ADM001', '2025-06-23', '2025-06-23T11:14:16.981000+00:00', '2025-07-07T04:22:29.084000+00:00', '2025-07-05', NULL, NULL),
('MTH002', 'kdfdkljf', '25', 'prathamgarg975@gmail.com', '2222222222', '2000-02-12', 'djfjd', 'HDFC Bank', '333333333333333333', 'HDFC0000154', '111111111111', '', 'ADM002', '2025-06-27', '', '2025-06-28T14:39:02.241000+00:00', '2025-07-08', NULL, NULL),
('MTH003', 'rekaha', '24', 'karandeepcsc@gmail.com', '3333333333', '2000-12-29', 'kkkkkkkk', 'Punjab National Bank', '3333333333333333', 'PUNB0057400', '444444444444', '', 'ADM003', '2025-07-02', '', '', '2025-07-02', NULL, NULL),
('MTH004', 'abcdddd', '25', 'gargpratham975@gmail.com', '2222222222', '2000-01-01', 'abcdde', 'Punjab National Bank', '111111111111111111', 'PUNB0445500', '123412341234', NULL, 'ADM001', '2025-07-15', '2025-07-15T11:30:39.572Z', '2025-07-15T11:30:39.572Z', '2025-07-15', NULL, NULL),
('MTH005', 'karan', '26', 'karandeepcscs@gmail.com', '4634535435', '1999-02-14', 'djfd', 'HDFC Bank', '4353243532434', 'HDFC0000154', '354332423432', NULL, 'ADM001', '2025-07-21', '2025-07-21T05:45:23.420Z', '2025-07-21T05:45:23.421Z', '2025-07-18', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `mothers_health_data`
--

CREATE TABLE `mothers_health_data` (
  `mother_id` varchar(10) DEFAULT NULL,
  `date` varchar(32) DEFAULT NULL,
  `temperature` varchar(15) DEFAULT NULL,
  `height` varchar(15) DEFAULT NULL,
  `weight` varchar(15) DEFAULT NULL,
  `bmi` varchar(15) DEFAULT NULL,
  `spo2` varchar(15) DEFAULT NULL,
  `pulse` varchar(15) DEFAULT NULL,
  `hemoglobin` varchar(15) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `mothers_health_data`
--

INSERT INTO `mothers_health_data` (`mother_id`, `date`, `temperature`, `height`, `weight`, `bmi`, `spo2`, `pulse`, `hemoglobin`) VALUES
('MTH001', '2025-02-01', '', '', '', '', '', '', ''),
('MTH001', '2025-02-02', '', '', '', '', '', '', ''),
('MTH001', '2025-02-03', '', '', '', '', '', '', ''),
('MTH001', '2025-04-03', '', '', '', '', '', '', ''),
('MTH001', '2025-06-01', '', '', '', '', '', '', ''),
('MTH001', '2025-06-02', '', '', '', '', '', '', ''),
('MTH001', '2025-06-03', '', '', '', '', '', '', ''),
('MTH001', '2025-06-04', '', '', '', '', '', '', ''),
('MTH001', '2025-06-06', '', '', '', '', '', '', ''),
('MTH001', '2025-06-09', '', '', '', '', '', '', ''),
('MTH001', '2025-06-14', '', '', '', '', '', '', ''),
('MTH001', '2025-07-03', '98.6', '150', '70', '31.', '98', '80', '13.2'),
('MTH001', '2025-07-04', '36.9', '149.8', '81.9', '36.', '99.7', '86.2', '11.6'),
('MTH002', '2025-07-05', '', '', '', '3.3', '', '', ''),
('MTH001', '2025-07-09', '', '', '', '', '', '', ''),
('MTH001', '2025-07-15', '37.6', '191.4', '73.2', '20.', '96.2', '70.2', '10.0');

-- --------------------------------------------------------

--
-- Table structure for table `mothers_vaccination`
--

CREATE TABLE `mothers_vaccination` (
  `mother_id` varchar(10) DEFAULT NULL,
  `vaccine` varchar(15) DEFAULT NULL,
  `date_schedule` varchar(32) DEFAULT NULL,
  `status` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `mothers_vaccination`
--

INSERT INTO `mothers_vaccination` (`mother_id`, `vaccine`, `date_schedule`, `status`) VALUES
('MTH001', 'td1', '2025-07-05', 'True'),
('MTH001', 'td2', '2025-08-05', 'True'),
('MTH001', 'tdBooster', '2026-12-05', 'True'),
('MTH002', 'td1', '2025-07-22', 'True'),
('MTH002', 'td2', '2025-08-19', 'True'),
('MTH003', 'td1', '', 'False');

-- --------------------------------------------------------

--
-- Table structure for table `panchayats`
--

CREATE TABLE `panchayats` (
  `panchayat_id` varchar(10) DEFAULT NULL,
  `panchayat_name` varchar(30) DEFAULT NULL,
  `location` varchar(30) DEFAULT NULL,
  `admin_id` varchar(10) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `panchayats`
--

INSERT INTO `panchayats` (`panchayat_id`, `panchayat_name`, `location`, `admin_id`, `updated_at`) VALUES
('PAN001', 'Saha', 'Ambala', 'ADM001', '2025-07-02T08:07:17.140000+00:00'),
('PAN002', 'Dhakoli', 'Ambala', 'ADM002', '2025-07-02T08:08:00.093000+00:00'),
('PAN003', 'awesome', 'yahae', 'ADM003', '2025-06-29T07:59:34.767000+00:00');

-- --------------------------------------------------------

--
-- Table structure for table `superadmin`
--

CREATE TABLE `superadmin` (
  `super_admin` varchar(10) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `aadhaar_no` varchar(12) DEFAULT NULL,
  `role` varchar(15) DEFAULT NULL,
  `updated_at` varchar(32) DEFAULT NULL,
  `password` varchar(60) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_general_ci;

--
-- Dumping data for table `superadmin`
--

INSERT INTO `superadmin` (`super_admin`, `email`, `aadhaar_no`, `role`, `updated_at`, `password`) VALUES
('SUP001', 'karandeepcscs@gmail.com', '123456789000', 'superadmin', '2025-07-04T06:45:47.404000+00:00', '$2b$12$/3CjpYIkWvbisLZgL7OM/.8S.mD58nMtFbZ.V.G.VG6q1M.mDy3gG');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
