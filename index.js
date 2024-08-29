const express = require('express');
const cors = require('cors');
require('dotenv').config();

const convertRoutes = require('./routes/convert');
const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

app.use('/auth', authRoutes);
app.use('/', convertRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
