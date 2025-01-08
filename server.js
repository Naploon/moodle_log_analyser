const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Add any other necessary routes or middleware here

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});