const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const generateRoute = require('./routes/generate');
const inspectRoute = require('./routes/inspect');
const refineRoute = require('./routes/refine');

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'sayso' });
});

app.use('/api/generate', generateRoute);
app.use('/api/inspect', inspectRoute);
app.use('/api/refine', refineRoute);

app.listen(port, () => {
  console.log(`SAYSO server listening on port ${port}`);
});
