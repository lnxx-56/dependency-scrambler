// Sample Express Application
const express = require('express');
const _ = require('lodash');
const app = express();
const port = process.env.PORT || 3000;

// Simple in-memory data
const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' },
];

// Set up middleware
app.use(express.json());

// Define routes
app.get('/', (req, res) => {
  res.send('Sample project for NPM Roulette');
});

app.get('/api/items', (req, res) => {
  res.json(items);
});

app.get('/api/items/:id', (req, res) => {
  const item = _.find(items, { id: parseInt(req.params.id, 10) });
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
