/*USE THESE TO CREATE THE SERVER THAN ADD A USER IN THE ADMINISTRATION TAB WITH ONLY INSERT AND SELECT PRIVALEGES*/


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,  -- Indicates whether the user has voted
    date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    changed_by VARCHAR(255)
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
    changed_by VARCHAR(255)
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
    date_changed TIMESTAMP DEFAULT CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    changed_by VARCHAR(255),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

CREATE TRIGGER created_by_ballots
BEFORE INSERT ON ballots 
FOR EACH ROW
SET NEW.created_by = USER();

CREATE TRIGGER changed_by_ballots 
BEFORE UPDATE ON ballots 
FOR EACH ROW
SET NEW.changed_by = USER();

/*
drop table ballots;
drop table candidates;
drop table users;
*/

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
