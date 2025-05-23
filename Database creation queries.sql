/*USE THESE TO CREATE THE SERVER THAN ADD A USER IN THE ADMINISTRATION TAB WITH ONLY INSERT AND SELECT PRIVALEGES*/

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL UNIQUE,
    description VARCHAR(255)
);

INSERT INTO roles (role_name, description) VALUES
('administrator', 'Has full access to manage users, candidates, and election process'),
('voter', 'Can vote in the election'),
('viewer', 'Can view election results');

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,  -- Indicates whether the user has voted
    is_candidate BOOLEAN DEFAULT FALSE,  -- Indicates whether the user is a candidate
    role_id INT,  -- Foreign key to the roles table
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    changed_by VARCHAR(255),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TRIGGER created_by_users
BEFORE INSERT ON users
FOR EACH ROW
SET NEW.created_by = USER();

CREATE TRIGGER changed_by_users
BEFORE UPDATE ON users
FOR EACH ROW
SET NEW.changed_by = USER();



CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    changed_by VARCHAR(255),
    active BOOLEAN DEFAULT TRUE
);


CREATE TRIGGER created_by_candidates
BEFORE INSERT ON candidates
FOR EACH ROW
SET NEW.created_by = USER();

CREATE TRIGGER changed_by_candidates
BEFORE UPDATE ON candidates
FOR EACH ROW
SET NEW.changed_by = USER();

CREATE TABLE ballots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ballot_id CHAR(36) NOT NULL,
    candidate_id INT NOT NULL,
    rankno INT NOT NULL,
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    changed_by VARCHAR(255),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);


CREATE TRIGGER created_by_ballots
BEFORE INSERT ON ballots 
FOR EACH ROW
SET NEW.created_by = USER();

CREATE TRIGGER changed_by_ballots 
BEFORE UPDATE ON ballots 
FOR EACH ROW
SET NEW.changed_by = USER();

INSERT INTO candidates (name)
VALUES 
    ('John Smith'),
    ('Adam Finney'),
    ('Koo leguy'),
    ('Big squeeze'),
    ('Changler Indrum'),
    ('Choogle leThe'),
    ('Smithy leChoogar'),
    ('Crooked McBawls'),
    ('Das Desonble'),
    ('Goo DePresident');
    
-- Create Elections Table
CREATE TABLE elections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Seed default elections
INSERT INTO elections (name) VALUES ('Election 1'), ('Election 2'), ('Election 3');

-- Add election_id to users
ALTER TABLE users ADD COLUMN election_id INT DEFAULT 1;
ALTER TABLE users ADD FOREIGN KEY (election_id) REFERENCES elections(id);

-- Add election_id to candidates
ALTER TABLE candidates ADD COLUMN election_id INT;
ALTER TABLE candidates ADD FOREIGN KEY (election_id) REFERENCES elections(id);

-- Add election_id to ballots
ALTER TABLE ballots ADD COLUMN election_id INT;
ALTER TABLE ballots ADD FOREIGN KEY (election_id) REFERENCES elections(id)

UPDATE users SET role_id = '1' WHERE username = 'testuser1';
UPDATE users SET role_id = '2' WHERE username = 'testuser2';

 /*
drop table ballots;
drop table candidates;
drop table users;
drop table roles;
 
 select * from users;   
select * from roles;
select * from candidates;
delete from candidates;
delete from ballots;
select * from ballots;

select * from candidates;*/