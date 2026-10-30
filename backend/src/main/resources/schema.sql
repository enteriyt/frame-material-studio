CREATE TABLE IF NOT EXISTS templates (
 id VARCHAR(64) PRIMARY KEY, title VARCHAR(100) NOT NULL, category VARCHAR(50) NOT NULL,
 description VARCHAR(500) NOT NULL, cover_url VARCHAR(255) NOT NULL,
 required_image_count INT NOT NULL, max_file_size_bytes BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS assets (
 id VARCHAR(36) PRIMARY KEY, owner_id VARCHAR(64) NOT NULL, url VARCHAR(255) NOT NULL,
 size_bytes BIGINT NOT NULL, mime_type VARCHAR(50) NOT NULL, created_at TIMESTAMP(6) NOT NULL
);
CREATE TABLE IF NOT EXISTS tasks (
 id VARCHAR(36) PRIMARY KEY, owner_id VARCHAR(64) NOT NULL, template_id VARCHAR(64) NOT NULL,
 template_title VARCHAR(100) NOT NULL, status VARCHAR(20) NOT NULL, stage VARCHAR(20) NOT NULL,
 result_url VARCHAR(255), error VARCHAR(500), fail_stage VARCHAR(20), delay_ms INT NOT NULL,
 created_at TIMESTAMP(6) NOT NULL, updated_at TIMESTAMP(6) NOT NULL,
 INDEX idx_tasks_owner_created (owner_id, created_at),
 FOREIGN KEY (template_id) REFERENCES templates(id)
);
CREATE TABLE IF NOT EXISTS task_assets (
 task_id VARCHAR(36) NOT NULL, asset_id VARCHAR(36) NOT NULL, position_no INT NOT NULL,
 PRIMARY KEY(task_id, position_no), FOREIGN KEY(task_id) REFERENCES tasks(id),
 FOREIGN KEY(asset_id) REFERENCES assets(id)
);
