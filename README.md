# EchoStats - FaceIt Analytics Dashboard

A comprehensive analytical dashboard for tracking and analyzing FaceIt gaming statistics. This application provides detailed insights into your FaceIt matches, player performance, and gaming trends.

## Features

- Real-time match statistics
- Player performance analytics
- Historical match data visualization
- Interactive dashboard interface
- Detailed game metrics and trends

## Installation

1. Clone the repository:
```bash
clone the project
cd EchoStats-FaceIt
```

2. Install dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
npm install axios
```

3. Set up environment variables:
   - Create a `.env` file in the server directory
   - Add your FaceIt API key and other necessary configuration

## Configuration

Before running the application, make sure to:

1. Obtain a FaceIt API key from the FaceIt Developer Portal
2. Configure the following environment variables in `server/.env` file:
   ```
   FACEIT_API_KEY=your_api_key_here
   PORT=3000
   ```

## Starting the Project

4. Start the application:
```bash
# Start the server (from server directory)
npm start

# Start the client (from client directory)
npm start
```

## Project Structure

- `client/` - Frontend React application
- `server/` - Backend Express server
- `package.json` - Project dependencies and scripts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
