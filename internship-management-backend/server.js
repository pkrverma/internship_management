// Load environment variables from .env first
const dotenv = require("dotenv");
dotenv.config();

// Import the express app
const app = require("./src/app");

// Define port (from env or fallback to 5000)
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
