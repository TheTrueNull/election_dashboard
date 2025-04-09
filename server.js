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
    if (err) {
      console.error('Error checking user existence:', err);
      return res.status(500).json({ message: 'Server error checking user existence' });
    }

    if (results.length > 0) {
      return res.redirect('/registration.html?error=Username%20or%20email%20already%20exists');
    }

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error hashing password:', err);
        return res.status(500).json({ message: 'Server error hashing password' });
      }

      // Insert new user with default role_id = 2 (Voter)
      const insertQuery = 'INSERT INTO users (username, password, email, role_id) VALUES (?, ?, ?, ?)';
      db.query(insertQuery, [username, hash, email, 2], (err, result) => {
        if (err) {
          console.error('Error inserting new user:', err);
          return res.status(500).json({ message: 'Error inserting new user' });
        }

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

// Delete candidates (Admin only)
app.post('/api/admin/delete_candidates', verifyJWT, isAdmin, (req, res) => {
  const { candidate_ids } = req.body;

  if (!candidate_ids || candidate_ids.length === 0) {
    return res.status(400).json({ message: 'No candidates selected for deletion' });
  }

  const query = 'DELETE FROM candidates WHERE id IN (?)';
  db.query(query, [candidate_ids], (err, result) => {
    if (err) {
      console.error('Error deleting candidates:', err);
      return res.status(500).json({ message: 'Error deleting candidates' });
    }
    res.status(200).json({ message: 'Candidates deleted successfully' });
  });
});

// Update candidate name
app.post('/api/admin/edit_candidate', verifyJWT, isAdmin, (req, res) => {
  const { id, name } = req.body;

  if (!id || !name || name.trim() === "") {
    return res.status(400).json({ message: 'Candidate ID and new name are required' });
  }

  const query = 'UPDATE candidates SET name = ? WHERE id = ?';
  db.query(query, [name, id], (err, result) => {
    if (err) {
      console.error('Error updating candidate:', err);
      return res.status(500).json({ message: 'Error updating candidate name' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Candidate not found' });
    }
    res.status(200).json({ message: 'Candidate name updated successfully' });
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
  const method = req.headers['x-voting-method'] || 'Instant Runoff';

  const getBallotsQuery = 'SELECT ballot_id, candidate_id, rankno FROM ballots ORDER BY ballot_id, rankno';
  const getCandidatesQuery = 'SELECT * FROM candidates';

  db.query(getCandidatesQuery, (err, candidateResults) => {
    if (err) {
      console.error('Error fetching candidates:', err);
      return res.status(500).json({ message: 'Error fetching candidates' });
    }

    db.query(getBallotsQuery, (err, ballotResults) => {
      if (err) {
        console.error('Error fetching ballots:', err);
        return res.status(500).json({ message: 'Error fetching ballots' });
      }

      const ballots = {};
      ballotResults.forEach(row => {
        if (!ballots[row.ballot_id]) {
          ballots[row.ballot_id] = [];
        }
        ballots[row.ballot_id].push({ candidate_id: row.candidate_id, rankno: row.rankno });
      });

      // ✅ Use selected method
      if (method === 'Ranked Pairs') {
        const rpWinner = calculateRankedPairsWinner(ballots, candidateResults);
        if (rpWinner) {
          return res.status(200).json({ winner: rpWinner.name });
        } else {
          return res.status(500).json({ message: 'Could not determine a Ranked Pairs winner' });
        }
      } else if (method === 'Coombs') {
        const coombsWinner = calculateCoombsWinner(ballots, candidateResults);
        if (coombsWinner) {
          return res.status(200).json({ winner: coombsWinner.name });
        } else {
          return res.status(500).json({ message: 'Could not determine a Coombs Method winner' });
        }
      } else {
        const irvWinner = calculateIRVWinner(ballots, candidateResults);
        if (irvWinner) {
          return res.status(200).json({ winner: irvWinner.name });
        } else {
          return res.status(500).json({ message: 'Could not determine an IRV winner' });
        }
      }
    });
  });
});

function calculateCoombsWinner(ballots, candidates) {
  const candidateIds = candidates.map(c => c.id);

  let activeCandidates = new Set(candidateIds);

  while (activeCandidates.size > 1) {
    const lastPlaceCounts = {};

    // Initialize counts
    activeCandidates.forEach(id => lastPlaceCounts[id] = 0);

    // Tally last-place votes
    Object.values(ballots).forEach(ballot => {
      const ranked = ballot
        .filter(b => activeCandidates.has(b.candidate_id))
        .sort((a, b) => a.rankno - b.rankno);
      if (ranked.length > 0) {
        const lastPlace = ranked[ranked.length - 1].candidate_id;
        lastPlaceCounts[lastPlace]++;
      }
    });

    // Eliminate the candidate with the most last-place votes
    const maxLastPlaceVotes = Math.max(...Object.values(lastPlaceCounts));
    const mostUnpopular = Object.keys(lastPlaceCounts).find(
      id => lastPlaceCounts[id] === maxLastPlaceVotes
    );

    activeCandidates.delete(parseInt(mostUnpopular));
  }

  const [winnerId] = [...activeCandidates];
  return candidates.find(c => c.id === winnerId) || null;
}


// Ranked Pairs Voting Algorithm
app.get('/api/calculate_winner_ranked_pairs', (req, res) => {
  const getBallotsQuery = 'SELECT ballot_id, candidate_id, rankno FROM ballots ORDER BY ballot_id, rankno';
  const getCandidatesQuery = 'SELECT * FROM candidates';

  db.query(getCandidatesQuery, (err, candidates) => {
    if (err) {
      console.error('Error fetching candidates:', err);
      return res.status(500).json({ message: 'Error fetching candidates' });
    }

    db.query(getBallotsQuery, (err, ballotResults) => {
      if (err) {
        console.error('Error fetching ballots:', err);
        return res.status(500).json({ message: 'Error fetching ballots' });
      }

      // Step 1: Build ballots object
      const ballots = {};
      ballotResults.forEach(row => {
        if (!ballots[row.ballot_id]) {
          ballots[row.ballot_id] = [];
        }
        ballots[row.ballot_id].push({ candidate_id: row.candidate_id, rankno: row.rankno });
      });

      const winner = calculateRankedPairsWinner(ballots, candidates);
      if (winner) {
        return res.status(200).json({ winner: winner.name });
      } else {
        return res.status(500).json({ message: 'Could not determine a winner using Ranked Pairs' });
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

function calculateRankedPairsWinner(ballots, candidates) {
  const candidateIds = candidates.map(c => c.id);
  const pairwise = {};

  // Initialize pairwise margins
  for (let i of candidateIds) {
    for (let j of candidateIds) {
      if (i !== j) pairwise[`${i}-${j}`] = 0;
    }
  }

  // Tally pairwise comparisons
  for (let ballotId in ballots) {
    const ranking = ballots[ballotId].sort((a, b) => a.rankno - b.rankno);
    for (let i = 0; i < ranking.length; i++) {
      for (let j = i + 1; j < ranking.length; j++) {
        const higher = ranking[i].candidate_id;
        const lower = ranking[j].candidate_id;
        pairwise[`${higher}-${lower}`]++;
      }
    }
  }

  // Build list of victories
  const victories = [];
  for (let i of candidateIds) {
    for (let j of candidateIds) {
      if (i === j) continue;
      const forward = pairwise[`${i}-${j}`] || 0;
      const backward = pairwise[`${j}-${i}`] || 0;
      if (forward > backward) {
        victories.push({
          winner: i,
          loser: j,
          margin: forward - backward
        });
      }
    }
  }

  // Sort by margin descending
  victories.sort((a, b) => b.margin - a.margin);

  // Lock victories without creating cycles
  const locked = {};
  candidateIds.forEach(id => (locked[id] = []));

  const createsCycle = (start, current) => {
    if (start === current) return true;
    for (let next of locked[current]) {
      if (createsCycle(start, next)) return true;
    }
    return false;
  };

  victories.forEach(({ winner, loser }) => {
    locked[winner].push(loser);
    if (createsCycle(winner, loser)) {
      // Revert if cycle created
      locked[winner].pop();
    }
  });

  // The winner is the candidate with no arrows pointing to them
  for (let id of candidateIds) {
    const hasIncoming = Object.values(locked).some(list => list.includes(id));
    if (!hasIncoming) {
      return candidates.find(c => c.id === id);
    }
  }

  return null;
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
