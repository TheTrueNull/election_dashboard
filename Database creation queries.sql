/*USE THESE TO CREATE THE SERVER THAN ADD A USER IN THE ADMINISTRATION TAB WITH ONLY INSERT AND SELECT PRIVALEGES*/


CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,  -- Indicates whether the user has voted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE candidates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ballots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ballot_id CHAR(36) NOT NULL UNIQUE,  -- A unique identifier for the ballot (UUID)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ballot_rankings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ballot_id CHAR(36) NOT NULL,
    candidate_id INT NOT NULL,
    rankno INT NOT NULL,        
    FOREIGN KEY (ballot_id) REFERENCES ballots(ballot_id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);

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
