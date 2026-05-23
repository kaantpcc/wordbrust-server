# WordBrust Server

  WordBrust Server is the backend service for a real-time multiplayer word game.
  It handles authentication, game matchmaking, board management, player letters, moves, scoring-related game state, and
  real-time room communication with Socket.IO.

  This project was built with a backend-first approach using Node.js, Express, PostgreSQL, Sequelize, JWT authentication,
  and Socket.IO.

  ## Features

  - JWT-based user authentication
  - Password hashing with bcrypt
  - Real-time multiplayer game rooms with Socket.IO
  - Game matchmaking and room join/leave flow
  - Two-player readiness signal
  - Move event broadcasting
  - Game resignation signal
  - Board initialization and board cell management
  - Player letter and letter pool management
  - PostgreSQL persistence with Sequelize
  - REST API routes for auth, users, games, boards, letters, and moves
  - Docker support

  ## Tech Stack

  - Node.js
  - Express.js
  - PostgreSQL
  - Sequelize
  - Socket.IO
  - JWT
  - bcrypt
  - Docker

  ## Project Structure

  ```text
  src/
    config/        Database configuration and letter definitions
    controllers/   Request handlers for auth, users, games, boards, letters, and moves
    middlewares/   Authentication middleware
    models/        Sequelize models
    routes/        Express route definitions
    services/      Business logic for auth, users, games, boards, letters, and moves
    socket.js      Socket.IO room and real-time event handling
    index.js       Application entry point

  ## API Areas

  /api/auth      Authentication routes
  /api/user      User routes
  /api/game      Game routes
  /api/board     Board routes
  /api/letter    Letter routes
  /api/move      Move routes

  ## Real-Time Events

  WordBrust uses Socket.IO for game room communication.

  Supported socket behavior includes:

  join_game_room     Join a game-specific Socket.IO room
  leave_game_room    Leave a game-specific Socket.IO room
  both_players_ready Emitted when both players join the same game room
  move_made          Emitted after a player makes a move
  game_resigned      Emitted when a player resigns from a game

  ## Getting Started

  Clone the repository:

  git clone https://github.com/kaantpcc/wordbrust-server.git
  cd wordbrust-server

  Install dependencies:

  npm install

  Create a .env file in the project root and configure the required environment variables.

  Example environment variables:

  PORT=3000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=wordbrust
  DB_USER=postgres
  DB_PASSWORD=your_password
  JWT_SECRET=your_secret

  Start the server:

  node src/index.js

  The server runs on the port defined in the .env file.

  ## Docker

  This repository includes a Dockerfile, so the backend can be containerized for deployment or local testing.

  Example:

  docker build -t wordbrust-server .
  docker run -p 3000:3000 wordbrust-server

  Make sure the required environment variables and database connection are configured before running the container.

  ## Notes

  This repository contains the backend implementation of WordBrust.
  The main focus is real-time multiplayer game communication, REST API structure, PostgreSQL persistence, and backend game-
  flow management.
