# CSUN Election Dashboard

A full-stack ranked-choice voting system built for California State University, Northridge (CSUN). This dashboard allows voters to rank candidates via drag-and-drop and supports multiple voting algorithms including Instant Runoff Voting (IRV), Ranked Pairs, and Coombs Method.

## Features

- **User Authentication** – Secure registration and login with JWT-based sessions
- **CSUN Email Validation** – Only `@csun.edu` and `@my.csun.edu` emails are allowed
- **Email Confirmation** – Automatic registration confirmation via Nodemailer
- **Ranked-Choice Voting** – Drag-and-drop interface for ranking candidates
- **Multiple Voting Algorithms**:
  - Instant Runoff Voting (IRV)
  - Ranked Pairs (Condorcet method)
  - Coombs Method
- **Admin Panel** – Manage candidates, elections, users, and voting methods
- **Dark Mode** – Toggle between light and dark themes
- **Multi-Election Support** – Run multiple elections simultaneously

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | React 18, React Router, react-beautiful-dnd |
| Backend    | Node.js, Express.js                 |
| Database   | MySQL                               |
| Auth       | JWT (JSON Web Tokens), bcrypt       |
| Email      | Nodemailer (Gmail SMTP)             |

## Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v8.0 or higher)
- **npm** or **yarn**

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/election_dashboard.git
cd election_dashboard
```

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 3. Set Up the Database

Create a MySQL database and run the SQL schema:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE election_db;
USE election_db;
```

Then execute the queries in `Database creation queries.sql` to create all necessary tables:
- `roles` – User roles (administrator, voter, viewer)
- `users` – Registered users
- `candidates` – Election candidates
- `elections` – Election events
- `ballots` – Submitted ballots with rankings

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=election_db

# JWT Secret (use a strong, random string in production)
JWT_SECRET=your_secure_jwt_secret_key

# Email Configuration (for registration confirmation)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

> **Note:** For Gmail, you'll need to use an [App Password](https://support.google.com/accounts/answer/185833) if 2FA is enabled.

> **Security:** Never commit your `.env` file to version control. Add it to your `.gitignore`.

## Running the Application

### Development Mode

Run the backend and frontend separately:

```bash
# Terminal 1 - Start the backend server (port 5000)
node server.js

# Terminal 2 - Start the React dev server (port 3000)
cd client
npm start
```

The React app proxies API requests to the backend server.

### Production Mode

Build the React app and serve from Express:

```bash
cd client
npm run build
cd ..
node server.js
```

Access the app at `http://localhost:5000`

## Project Structure

```
election_dashboard/
├── server.js              # Express server & API routes
├── .env                   # Environment variables (create this)
├── config/
│   └── db.js              # MySQL connection (uses env vars)
├── client/
│   ├── public/            # Static files
│   ├── src/
│   │   ├── App.js         # Main React app & Dashboard
│   │   ├── AdminSettings.js  # Admin panel component
│   │   ├── DarkModeContext.jsx  # Dark mode state
│   │   └── index.js       # React entry point
│   └── build/             # Production build
├── public/
│   ├── signin.html        # Login page
│   └── registration.html  # Registration page
├── Database creation queries.sql  # Database schema
└── package.json
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Register a new user |
| POST | `/login` | User login |

### Voting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/candidates` | Get active candidates |
| POST | `/api/submit_ballot` | Submit ranked ballot |
| GET | `/api/calculate_winner` | Calculate election winner |

### Admin (requires admin role)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/candidates` | Get all candidates |
| POST | `/api/admin/add_candidate` | Add new candidate |
| POST | `/api/admin/edit_candidate` | Edit candidate |
| POST | `/api/admin/delete_candidates` | Delete candidates |
| POST | `/api/admin/update_candidates` | Update active status |
| GET | `/api/admin/users` | Get all users |
| GET | `/api/admin/elections` | Get all elections |
| POST | `/api/admin/update_user_election` | Assign user to election |

## User Roles

| Role ID | Role | Permissions |
|---------|------|-------------|
| 1 | Administrator | Full access to manage users, candidates, elections |
| 2 | Voter | Can vote and view results |
| 3 | Viewer | Can view election results only |

## Voting Algorithms

### Instant Runoff Voting (IRV)
Eliminates the candidate with the fewest first-choice votes each round until one candidate has a majority.

### Ranked Pairs
A Condorcet method that locks in pairwise victories by margin strength, avoiding cycles, to determine the winner.

### Coombs Method
Similar to IRV, but eliminates the candidate with the most last-place votes each round.

## Screenshots

*Dashboard with drag-and-drop ranking interface and dark mode support.*


---

**Built for CSUN Elections**
