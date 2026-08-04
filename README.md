# AgriSmart

AgriSmart is a mobile-friendly agricultural management platform with farmer, expert, and admin workflows.

## Features included in this MVP
- Secure registration and login
- Role-based dashboards
- Basic farm/profile data persistence
- REST API backend ready for deployment

## Backend setup
1. Install dependencies:
   npm install
2. Set environment variables:
   - PORT
   - MONGODB_URI
   - JWT_SECRET
   - FRONTEND_URL
3. Start the server:
   npm start

## Frontend setup
- Open frontend/html/index.html in a browser or host the frontend folder with a static server.
- Update frontend/js/config/api.js with your Render backend URL before production deployment.

## Deployment notes
- Deploy backend to Render as a Node.js service.
- Use MongoDB Atlas for MONGODB_URI.
- Set FRONTEND_URL to your frontend domain or Render static site URL.
