PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS testimonials;
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS sit_in_records;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS software;
DROP TABLE IF EXISTS labs;
DROP TABLE IF EXISTS announcements;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS admins;

CREATE TABLE admins (
  id            INTEGER   PRIMARY KEY AUTOINCREMENT,
  username      TEXT      NOT NULL UNIQUE,
  password_hash TEXT      NOT NULL,
  full_name     TEXT      NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO admins (id, username, password_hash, full_name, created_at) VALUES
(1, 'admin', '$2a$10$CstF.tvtIqBk1p3i3pqnheNAi8YLp0AyriWN3xUaAKENkA0cKK/4W', 'CCS Admin', '2026-03-23 14:55:36');

CREATE TABLE students (
  id                  INTEGER   PRIMARY KEY AUTOINCREMENT,
  id_number           TEXT      NOT NULL UNIQUE,
  full_name           TEXT      NOT NULL,
  email               TEXT      NOT NULL UNIQUE,
  password_hash       TEXT      NOT NULL,
  year_level          INTEGER   NOT NULL DEFAULT 1,
  course              TEXT      NOT NULL DEFAULT 'BSIT',
  remaining_sessions  INTEGER   NOT NULL DEFAULT 30,
  reservation_enabled INTEGER   NOT NULL DEFAULT 1,
  profile_photo       TEXT,
  address             TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (id, id_number, full_name, email, password_hash, year_level, course, remaining_sessions, profile_photo, created_at, updated_at, address) VALUES
(4, '23778632', 'Samantha Singcol', 'sam@gmail.com',  '$2a$10$Eub4zarpdnrD9AT02RZpmOKfgaA5fd96cijqJ4ToTc.8.qbFaQ/My', 1, 'BSIT', 29, '/uploads/student_4_1774278163160.jpg', '2026-03-23 14:58:06', '2026-03-23 15:06:10', 'Cebu'),
(5, '23778633', 'Luke Umpad',       'luke@gmail.com', '$2a$10$Eub4zarpdnrD9AT02RZpmOKfgaA5fd96cijqJ4ToTc.8.qbFaQ/My', 3, 'BSIT', 29, '/uploads/student_5_1774278143810.jpg', '2026-03-23 15:01:58', '2026-03-23 15:03:59', 'Lapu-Lapu'),
(6, '23778634', 'Test Student',     'test@gmail.com', '$2a$10$Eub4zarpdnrD9AT02RZpmOKfgaA5fd96cijqJ4ToTc.8.qbFaQ/My', 2, 'BSIT', 30, NULL, '2026-05-25 00:00:00', '2026-05-25 00:00:00', 'Cebu');

CREATE TABLE announcements (
  id         INTEGER   PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER   NOT NULL,
  admin_name TEXT      NOT NULL,
  content    TEXT      NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE
);

INSERT INTO announcements (id, admin_id, admin_name, content, created_at) VALUES
(1, 1, 'CCS Admin', 'We are happy to announce the launch of our new website!', '2026-03-23 15:05:40');

CREATE TABLE labs (
  id           INTEGER   PRIMARY KEY AUTOINCREMENT,
  name         TEXT      NOT NULL,
  room_number  TEXT      NOT NULL,
  capacity     INTEGER   NOT NULL DEFAULT 30,
  is_available INTEGER   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO labs (id, name, room_number, capacity, is_available, created_at) VALUES
(1, 'Lab 524', '524', 50, 1, '2026-03-23 14:55:00'),
(2, 'Lab 526', '526', 50, 1, '2026-03-23 14:55:00'),
(3, 'Lab 528', '528', 50, 1, '2026-03-23 14:55:00'),
(4, 'Lab 530', '530', 50, 1, '2026-03-23 14:55:00');

CREATE TABLE software (
  id           INTEGER   PRIMARY KEY AUTOINCREMENT,
  name         TEXT      NOT NULL,
  version      TEXT,
  category     TEXT      NOT NULL DEFAULT 'General',
  description  TEXT,
  lab_id       INTEGER,
  is_available INTEGER   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lab_id) REFERENCES labs(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  id         INTEGER   PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER   NOT NULL,
  purpose    TEXT      NOT NULL,
  lab_room   TEXT      NOT NULL DEFAULT '524',
  pc_number  TEXT,
  status     TEXT      NOT NULL DEFAULT 'active',
  started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at   TIMESTAMP,
  CHECK (status IN ('active', 'ended')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

INSERT INTO sessions (id, student_id, purpose, lab_room, status, started_at, ended_at) VALUES
(1, 4, 'C# Programming',  '524', 'ended', '2026-03-23 15:03:22', '2026-03-23 15:03:28'),
(2, 5, 'Java Programming', '530', 'ended', '2026-03-23 15:03:53', '2026-03-23 15:03:59');

CREATE TABLE sit_in_records (
  id         INTEGER   PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER   NOT NULL,
  session_id INTEGER   NOT NULL,
  id_number  TEXT      NOT NULL,
  full_name  TEXT      NOT NULL,
  purpose    TEXT      NOT NULL,
  lab_room   TEXT      NOT NULL,
  pc_number  TEXT,
  date       DATE      NOT NULL,
  time_in    TIME      NOT NULL,
  time_out   TIME      NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

INSERT INTO sit_in_records (id, student_id, session_id, id_number, full_name, purpose, lab_room, pc_number, date, time_in, time_out, created_at) VALUES
(1, 4, 1, '23778632', 'Samantha Singcol', 'C# Programming',  '524', 'PC-01', '2026-03-23', '23:03:22', '23:03:28', '2026-03-23 15:03:28'),
(2, 5, 2, '23778633', 'Luke Umpad',       'Java Programming', '530', 'PC-12', '2026-03-23', '23:03:53', '23:03:59', '2026-03-23 15:03:59');

CREATE TABLE feedback (
  id           INTEGER   PRIMARY KEY AUTOINCREMENT,
  student_id   INTEGER   NOT NULL,
  record_id    INTEGER   NOT NULL UNIQUE,
  content      TEXT      NOT NULL,
  submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (record_id)  REFERENCES sit_in_records(id) ON DELETE CASCADE
);

CREATE TABLE testimonials (
  id                INTEGER   PRIMARY KEY AUTOINCREMENT,
  student_id        INTEGER   NOT NULL,
  content           TEXT      NOT NULL,
  rating            INTEGER   NOT NULL DEFAULT 5,
  lab_id            INTEGER,
  session_record_id INTEGER,
  is_anonymous      INTEGER   NOT NULL DEFAULT 0,
  is_approved       INTEGER   NOT NULL DEFAULT 1,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id)        REFERENCES students(id)       ON DELETE CASCADE,
  FOREIGN KEY (session_record_id) REFERENCES sit_in_records(id) ON DELETE CASCADE
);

CREATE TABLE reservations (
  id             INTEGER   PRIMARY KEY AUTOINCREMENT,
  student_id     INTEGER   NOT NULL,
  purpose        TEXT      NOT NULL,
  lab_room       TEXT      NOT NULL,
  pc_number      TEXT      NOT NULL,
  date           DATE      NOT NULL,
  time_preferred TIME      NOT NULL,
  status         TEXT      NOT NULL DEFAULT 'Pending',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (status IN ('Pending', 'Approved', 'Cancelled')),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_student_id       ON sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_sit_in_records_student_id ON sit_in_records(student_id);
CREATE INDEX IF NOT EXISTS idx_sit_in_records_session_id ON sit_in_records(session_id);
CREATE INDEX IF NOT EXISTS idx_announcements_admin_id    ON announcements(admin_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student_id       ON feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_record_id        ON feedback(record_id);
CREATE INDEX IF NOT EXISTS idx_testimonials_student_id   ON testimonials(student_id);
CREATE INDEX IF NOT EXISTS idx_software_lab_id           ON software(lab_id);
CREATE INDEX IF NOT EXISTS idx_reservations_student_id   ON reservations(student_id);
