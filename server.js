const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');  // For handling cookies
const path = require('path');
const crypto = require('crypto');  // For generating random ballot IDs
const db = require('./config/db');  // MySQL database connection
require('dotenv').config();  // To load environment variables

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// JWT Secret from environment variables
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';

// Serve static files (for signin and registration)
app.use(express.static(path.join(__dirname, 'public')));

// Handle registration form submission
app.post('/register_user', (req, res) => {
  const { username, password, confirm_password, email } = req.body;

  // Validate if passwords match
  if (password !== confirm_password) {
    return res.redirect('/registration.html?error=Passwords%20do%20not%20match');
  }

  // Check if the username or email already exists
  const checkQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(checkQuery, [username, email], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      return res.redirect('/registration.html?error=Username%20or%20email%20already%20exists');
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) throw err;

      const insertQuery = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
      db.query(insertQuery, [username, hash, email], (err, result) => {
        if (err) throw err;
        res.redirect('/signin.html?message=Registration%20successful,%20please%20login');
      });
    });
  });
});

// Handle login form submission (JWT creation)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM users WHERE username = ?';
  db.query(query, [username], (err, results) => {
    if (err) throw err;

    if (results.length === 0) {
      return res.redirect('/signin.html?error=Invalid%20username%20or%20password');
    }

    const user = results[0];

    // Compare the hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;

      if (!isMatch) {
        return res.redirect('/signin.html?error=Invalid%20username%20or%20password');
      }

      // Fetch role name
      const roleQuery = 'SELECT role_name FROM roles WHERE id = ?';
      db.query(roleQuery, [user.role_id], (err, roleResults) => {
        if (err) throw err;

        const roleName = roleResults[0].role_name;

        // Successful login: generate JWT with role
        const token = jwt.sign(
          { id: user.id, username: user.username, role: roleName },
          jwtSecret,
          { expiresIn: '1h' }
        );

        // Set the token as a cookie
        res.cookie('token', token, { httpOnly: true, path: '/' });

        // Redirect to the React app (served from Express)
        res.redirect('/');
      });
    });
  });
});

// Fetch active candidates for the dashboard
app.get('/api/candidates', (req, res) => {
  const query = 'SELECT id, name FROM candidates WHERE active = TRUE';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching active candidates:', err);
      return res.status(500).json({ message: 'Error fetching candidates' });
    }
    res.json(results);
  });
});

// Fetch all candidates for the Admin Settings page
app.get('/api/admin/candidates', verifyJWT, isAdmin, (req, res) => {
  const query = 'SELECT id, name, active FROM candidates';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching candidates:', err);
      return res.status(500).json({ message: 'Error fetching candidates' });
    }
    // Map 'active' to 'is_active' to match frontend expectations
    const candidates = results.map(candidate => ({
      ...candidate,
      is_active: candidate.active,  // Map 'active' to 'is_active'
    }));
    res.json(candidates);
  });
});

// Update candidate active statuses in the candidates table
app.post('/api/admin/update_candidates', verifyJWT, isAdmin, (req, res) => {
  const updatedStatuses = req.body.updatedStatuses;

  // Update each candidate's active status in the database
  const queries = updatedStatuses.map(candidate => (
    new Promise((resolve, reject) => {
      const query = 'UPDATE candidates SET active = ? WHERE id = ?';
      db.query(query, [candidate.is_active, candidate.id], (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    })
  ));

  Promise.all(queries)
    .then(() => res.status(200).json({ message: 'Candidate statuses updated successfully' }))
    .catch(error => {
      console.error('Error updating candidate statuses:', error);
      res.status(500).json({ message: 'Error updating candidate statuses' });
    });
});


app.post('/api/admin/add_candidate', (req, res) => {
  const { name, is_active } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Candidate name is required' });
  }

  const query = 'INSERT INTO candidates (name, active) VALUES (?, ?)';
  db.query(query, [name, is_active ? 1 : 0], (err, result) => {
    if (err) {
      console.error('Error adding candidate:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'Candidate added successfully', candidateId: result.insertId });
  });
});

// JWT verification middleware
function verifyJWT(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/signin.html');  // Redirect to login if no token is present
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.redirect('/signin.html');  // Redirect if the token is invalid or expired
    }

    req.user = decoded;  // Set the decoded user information in the request
    next();  // Continue to the next middleware or route handler
  });
}

// Generate a random 36-character ballot ID
function generateBallotId() {
  return crypto.randomUUID();  // Generates a 36-character UUID
}

// Handle ballot submission
app.post('/api/submit_ballot', (req, res) => {
  const ballot = req.body; // Expecting an array of candidate_id and rank
  const ballotId = generateBallotId(); // Generate a unique ballot ID

  const insertQuery = 'INSERT INTO ballots (ballot_id, candidate_id, rankno) VALUES ?';

  const ballotValues = ballot.map(({ candidate_id, rank }) => [ballotId, candidate_id, rank]);

  // Insert the ranked candidates into the ballots table
  db.query(insertQuery, [ballotValues], (err, result) => {
    if (err) {
      console.error('Error inserting ballot:', err);
      return res.status(500).json({ message: 'Error submitting ballot' });
    }

    res.status(200).json({ message: 'Ballot submitted successfully' });
  });
});

// Function to calculate the winner using Instant Runoff Voting
app.get('/api/calculate_winner', (req, res) => {
  const getBallotsQuery = 'SELECT ballot_id, candidate_id, rankno FROM ballots ORDER BY ballot_id, rankno';
  const getCandidatesQuery = 'SELECT * FROM candidates';

  // First, fetch the candidates
  db.query(getCandidatesQuery, (err, candidateResults) => {
    if (err) {
      console.error('Error fetching candidates:', err);
      return res.status(500).json({ message: 'Error fetching candidates' });
    }

    // Now fetch the ballots
    db.query(getBallotsQuery, (err, ballotResults) => {
      if (err) {
        console.error('Error fetching ballots:', err);
        return res.status(500).json({ message: 'Error fetching ballots' });
      }

      // Process ballots by grouping by ballot_id
      const ballots = {};
      ballotResults.forEach(row => {
        if (!ballots[row.ballot_id]) {
          ballots[row.ballot_id] = [];
        }
        ballots[row.ballot_id].push({ candidate_id: row.candidate_id, rankno: row.rankno });
      });

      // Perform the Instant Runoff Voting algorithm
      const irvWinner = calculateIRVWinner(ballots, candidateResults);  // Pass candidates to IRV function

      if (irvWinner) {
        res.status(200).json({ winner: irvWinner.name });
      } else {
        res.status(500).json({ message: 'No winner could be determined' });
      }
    });
  });
});

// IRV Algorithm
function calculateIRVWinner(ballots, candidates) {
  const candidateIds = candidates.map(candidate => candidate.id);
  let candidateVotes = {};

  // Initialize vote counts
  candidateIds.forEach(id => {
    candidateVotes[id] = 0;
  });

  // Count first-choice votes
  Object.values(ballots).forEach(ballot => {
    const firstChoice = ballot.find(b => candidateIds.includes(b.candidate_id));
    if (firstChoice) {
      candidateVotes[firstChoice.candidate_id]++;
    }
  });

  // Instant runoff voting logic
  while (true) {
    // Check for a candidate with a majority
    const totalVotes = Object.values(candidateVotes).reduce((a, b) => a + b, 0);
    for (const candidateId in candidateVotes) {
      if (candidateVotes[candidateId] > totalVotes / 2) {
        return candidates.find(c => c.id === parseInt(candidateId));
      }
    }

    // Find the candidate with the fewest votes
    const minVotes = Math.min(...Object.values(candidateVotes));
    const candidatesWithMinVotes = Object.keys(candidateVotes).filter(id => candidateVotes[id] === minVotes);

    if (candidatesWithMinVotes.length === candidateIds.length) {
      return null; // No winner if all remaining candidates are tied
    }

    // Eliminate the candidate(s) with the fewest votes
    candidatesWithMinVotes.forEach(id => {
      delete candidateVotes[id];
    });

    // Transfer votes to next choices
    Object.values(ballots).forEach(ballot => {
      const nextChoice = ballot.find(b => candidateVotes[b.candidate_id] !== undefined);
      if (nextChoice) {
        candidateVotes[nextChoice.candidate_id]++;
      }
    });
  }
}

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
  const { role } = req.user;  // Get role from the JWT token
  if (role === 'administrator') {
    return next();
  } else {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
}
// Fetch all users (Admin only)
app.get('/api/admin/users', verifyJWT, isAdmin, (req, res) => {
  const query = 'SELECT id, username, email, is_candidate FROM users';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Fetch the user's role ID based on the JWT token
app.get('/api/user-role', verifyJWT, (req, res) => {
  const userId = req.user.id;
  const query = 'SELECT role_id FROM users WHERE id = ?';

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching user role:', err);
      return res.status(500).json({ message: 'Error fetching user role' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ role_id: results[0].role_id });
  });
});

// Apply the JWT verification middleware before serving the React app
app.use(verifyJWT);

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'client/build')));

// Catch-all route to send users to the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
