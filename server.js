const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const db = new sqlite3.Database(':memory:'); // Use ':memory:' for in-memory database or specify a file path

app.get('/', (req, res) => {
  res.send('Moodle Logfile Analyzer Backend');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});