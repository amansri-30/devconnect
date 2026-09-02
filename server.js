// Local development entrypoint. On Vercel the app is served as a serverless
// function via `api/index.js` (which exports the Express app without calling
// app.listen).
const connectDB = require('./config/db');
const app = require('./app');

// Connect Database
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));
