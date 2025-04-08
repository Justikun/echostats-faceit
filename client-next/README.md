# EchoStats-FaceIt

A web application for tracking player statistics from FaceIt for CS2.

## Technology Stack

- Frontend: React with Next.js
- Styling: Tailwind CSS
- Data Visualization: Chart.js
- HTTP Client: Axios
- Backend: Fastify

## Project Structure

- `client-next/`: Frontend Next.js application
- `server/`: Backend Fastify application

## Getting Started

### Setting Up the Backend

1. Create a `.env` file in the server directory with your FaceIt API key:

```
FACEIT_API_KEY=your_faceit_api_key
PORT=5001 # Optional, defaults to 5001
```

2. Install dependencies and start the server:

```bash
cd server
npm install
npm start
```

The server will run on port 5001 by default.

### Setting Up the Frontend

1. Create a `.env` file in the client-next directory with the server URL:

```
SERVER_URL=http://localhost:5001 # Change this to match your backend URL
```

2. Install dependencies and start the Next.js development server:

```bash
cd client-next
npm install
npm run dev
```

3. Open your browser to `http://localhost:3000` to use the application.

## Building for Production

### Backend

```bash
cd server
npm install
npm start
```

### Frontend

```bash
cd client-next
npm install
npm run build
npm start
```

## Features

- Search for FaceIt players by nickname
- View player statistics including Elo and skill level
- Display match history
- Track ban history
- Recent search history

## Environment Variables

### Backend Environment Variables

- `FACEIT_API_KEY`: Your FaceIt API key (required)
- `PORT`: Server port (default: 5001)
- `SERVER_URL`: URL where the server is hosted

### Frontend Environment Variables

- `SERVER_URL`: URL of the backend API (default: http://localhost:5001) 