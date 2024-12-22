const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const csv = require('csv-parser'); // Import csv-parser

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 5000;

// Function to load CSV data into memory
const loadData = () => {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream('data.csv')
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// API to fetch data
app.get('/api/data', async (req, res) => {
  const { ageGroup, gender, startDate, endDate } = req.query;

  try {
    // Load data from CSV
    const data = await loadData();
    let filteredData = data;

    if (ageGroup) {
      const [minAge, maxAge] = ageGroup.split('-').map(Number);
      filteredData = filteredData.filter((item) => {
        const age = item.Age.split('-').map(Number); // Age group format like 15-25 or >25
        return age[0] >= minAge && age[1] <= maxAge;
      });
    }

    if (gender) {
      filteredData = filteredData.filter((item) => item.Gender.toLowerCase() === gender.toLowerCase());
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredData = filteredData.filter((item) => {
        const date = new Date(item.Day);
        return date >= start && date <= end;
      });
    }

    res.json(filteredData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load data' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
