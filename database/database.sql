-- ============================================================
-- RMUTI Practicum Management System - MySQL Database Schema
-- สำหรับ import ผ่าน phpMyAdmin บน XAMPP
-- ============================================================

CREATE DATABASE IF NOT EXISTS rmuti_practicum
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE rmuti_practicum;

-- ============================================================
-- 1. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  role ENUM('admin','instructor','mentor','supervisor','head','student') NOT NULL DEFAULT 'student',
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  prefix_name VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  nickname VARCHAR(100),
  major VARCHAR(255),
  academic_year_level TINYINT,
  phone VARCHAR(20),
  address TEXT,
  profile_image_url TEXT,
  selected_mentor_id VARCHAR(36) NULL,
  selected_unit_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_mentor FOREIGN KEY (selected_mentor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_mentor ON users(selected_mentor_id);

-- ============================================================
-- 2. SUBJECTS TABLE (รายวิชา)
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  subject_code VARCHAR(20) NOT NULL UNIQUE,
  subject_name VARCHAR(255) NOT NULL,
  credits TINYINT DEFAULT 3,
  practicum_level TINYINT NOT NULL CHECK (practicum_level IN (1, 2, 3)),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_subjects_level ON subjects(practicum_level);

-- ============================================================
-- 2b. COURSE_SECTIONS TABLE (กลุ่มเรียน)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_sections (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  subject_id VARCHAR(36) NOT NULL,
  section_name VARCHAR(50) NOT NULL,
  semester_id VARCHAR(36) NULL,
  instructor_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_section_subject FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  CONSTRAINT fk_section_semester FOREIGN KEY (semester_id) REFERENCES academic_semesters(id) ON DELETE SET NULL,
  CONSTRAINT fk_section_instructor FOREIGN KEY (instructor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_sections_subject ON course_sections(subject_id);
CREATE INDEX idx_sections_instructor ON course_sections(instructor_id);

-- ============================================================
-- 2c. COURSE_ENROLLMENTS TABLE (นักศึกษาในกลุ่มเรียน)
-- ============================================================
CREATE TABLE IF NOT EXISTS course_enrollments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  section_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_enroll_section FOREIGN KEY (section_id) REFERENCES course_sections(id) ON DELETE CASCADE,
  CONSTRAINT fk_enroll_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (section_id, student_id)
) ENGINE=InnoDB;

CREATE INDEX idx_enroll_section ON course_enrollments(section_id);
CREATE INDEX idx_enroll_student ON course_enrollments(student_id);

-- ============================================================
-- 3. UNIVERSITY_UNITS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS university_units (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 3. ACADEMIC_SEMESTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_semesters (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  year INT NOT NULL,
  semester TINYINT NOT NULL CHECK (semester IN (1, 2, 3)),
  is_current TINYINT(1) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Add FK from users.selected_unit_id to university_units
ALTER TABLE users
  ADD CONSTRAINT fk_users_unit FOREIGN KEY (selected_unit_id) REFERENCES university_units(id) ON DELETE SET NULL;

-- ============================================================
-- 4. ACTIVITY_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  semester_id VARCHAR(36) NULL,
  unit_id VARCHAR(36) NULL,
  practicum_level TINYINT NOT NULL CHECK (practicum_level IN (1, 2, 3)),
  activity_date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reflection TEXT,
  attachment_url TEXT,
  mentor_approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  mentor_feedback TEXT,
  mentor_approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_activity_semester FOREIGN KEY (semester_id) REFERENCES academic_semesters(id) ON DELETE SET NULL,
  CONSTRAINT fk_activity_unit FOREIGN KEY (unit_id) REFERENCES university_units(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_level ON activity_logs(practicum_level);
CREATE INDEX idx_activity_approval ON activity_logs(mentor_approval_status);

-- ============================================================
-- 5. ATTENDANCE_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  semester_id VARCHAR(36) NULL,
  unit_id VARCHAR(36) NULL,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  status ENUM('present','late','absent','leave') NOT NULL DEFAULT 'present',
  notes TEXT,
  mentor_approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  mentor_approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attendance_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_attendance_semester FOREIGN KEY (semester_id) REFERENCES academic_semesters(id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_unit FOREIGN KEY (unit_id) REFERENCES university_units(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_attendance_user ON attendance_logs(user_id);
CREATE INDEX idx_attendance_date ON attendance_logs(date);

-- ============================================================
-- 6. LESSON_PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_plans (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  semester_id VARCHAR(36) NULL,
  practicum_level TINYINT NOT NULL CHECK (practicum_level IN (1, 2, 3)),
  subject_name VARCHAR(255) NOT NULL,
  topic VARCHAR(255) NOT NULL,
  plan_url TEXT NOT NULL,
  plan_type ENUM('url','file') NOT NULL DEFAULT 'url',
  instructor_feedback TEXT,
  instructor_approval_status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  instructor_approved_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lesson_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lesson_semester FOREIGN KEY (semester_id) REFERENCES academic_semesters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_lesson_user ON lesson_plans(user_id);
CREATE INDEX idx_lesson_level ON lesson_plans(practicum_level);

-- ============================================================
-- 7. EVALUATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  semester_id VARCHAR(36) NULL,
  practicum_level TINYINT NOT NULL CHECK (practicum_level IN (1, 2, 3)),
  evaluator_id VARCHAR(36) NOT NULL,
  evaluator_role ENUM('mentor','supervisor','head','instructor','admin') NOT NULL,
  score DECIMAL(5,2) NOT NULL DEFAULT 0,
  comments TEXT,
  result ENUM('pass','fail','withdrawn','pending') NOT NULL DEFAULT 'pending',
  is_final TINYINT(1) DEFAULT 0,
  evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_eval_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_eval_evaluator FOREIGN KEY (evaluator_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_eval_semester FOREIGN KEY (semester_id) REFERENCES academic_semesters(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_eval_user ON evaluations(user_id);
CREATE INDEX idx_eval_level ON evaluations(practicum_level);

-- ============================================================
-- 8. AUDIT_LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  action VARCHAR(255) NOT NULL,
  actor_id VARCHAR(36) NULL,
  target_type VARCHAR(100),
  target_id VARCHAR(36),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ============================================================
-- 9. AUTH_TOKENS TABLE (for PHP session tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS auth_tokens (
  token VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_token_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_token_user ON auth_tokens(user_id);

-- ============================================================
-- SEED: Initial academic semester
-- ============================================================
INSERT INTO academic_semesters (year, semester, is_current, start_date, end_date)
SELECT 2569, 1, 1, '2026-06-01', '2026-10-31'
WHERE NOT EXISTS (SELECT 1 FROM academic_semesters WHERE is_current = 1);

-- ============================================================
-- SEED: Sample university units
-- ============================================================
INSERT INTO university_units (name, description, location)
SELECT 'โรงเรียนสาธิตมหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน', 'โรงเรียนสาธิตสำหรับฝึกปฏิบัติวิชาชีพ', 'อาคารเรียนรวม ชั้น 1'
WHERE NOT EXISTS (SELECT 1 FROM university_units WHERE name = 'โรงเรียนสาธิตมหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน');

INSERT INTO university_units (name, description, location)
SELECT 'ศูนย์คอมพิวเตอร์', 'หน่วยงานฝึกปฏิบัติด้านคอมพิวเตอร์', 'อาคารเทคโนโลยีสารสนเทศ ชั้น 3'
WHERE NOT EXISTS (SELECT 1 FROM university_units WHERE name = 'ศูนย์คอมพิวเตอร์');

INSERT INTO university_units (name, description, location)
SELECT 'หน่วยงานบริหารคณะ', 'สำนักงานคณะครุศาสตร์อุตสาหกรรม', 'อาคารครุศาสตร์อุตสาหกรรม ชั้น 2'
WHERE NOT EXISTS (SELECT 1 FROM university_units WHERE name = 'หน่วยงานบริหารคณะ');

-- ============================================================
-- SEED: Default admin account
-- Email: admin@rmuti.ac.th
-- Password: admin123
-- ============================================================
INSERT INTO users (role, status, email, password_hash, prefix_name, first_name, last_name)
SELECT 'admin', 'approved', 'admin@rmuti.ac.th', '$2y$12$J0mOIGHWZbr7sNtvko3Ab.babiUZ87duMGfvFJ0k2aTK8c.Q45Pja', 'นาย', 'ผู้ดูแลระบบ', 'RMUTI'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@rmuti.ac.th');
