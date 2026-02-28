-- Migration to add class_id and hod_id to labs table
ALTER TABLE labs
ADD COLUMN class_id INT DEFAULT NULL,
ADD COLUMN hod_id INT DEFAULT NULL,
ADD CONSTRAINT fk_lab_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
ADD CONSTRAINT fk_lab_hod FOREIGN KEY (hod_id) REFERENCES users(id) ON DELETE SET NULL;
