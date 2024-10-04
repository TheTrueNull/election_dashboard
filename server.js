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

      // Successful login: generate JWT
      const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '1h' });

      // Set the token as a cookie
      res.cookie('token', token, { httpOnly: true });

      // Redirect to the React app (served from Express)
      res.redirect('/');
    });
  });
});

// Fetch candidates from the database
app.get('/api/candidates', verifyJWT, (req, res) => {
  const query = 'SELECT * FROM candidates';
  db.query(query, (err, results) => {
    if (err) throw err;
    res.json(results);
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
