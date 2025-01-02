const express = require('express');
const path = require('path');
const { run } = require('./scraper/seleniumScript');
const MongoClient = require('mongodb').MongoClient;

const app = express();
const port = 3000;

// MongoDB connection string replace with yours
const mongoUri = 'mongodb+srv://account:password@cluster0.sj4pg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/run-script', async (req, res) => {
    let client;
    try {
        const { trends, ipAddress, dateTime } = await run();

        const istDateTime = new Date(dateTime).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

        client = await MongoClient.connect(mongoUri);
        const db = client.db('trending_topics_db');
        const collection = db.collection('trends');

        const record = {
            trends: {
                nameoftrend1: trends[0] || '',
                nameoftrend2: trends[1] || '',
                nameoftrend3: trends[2] || '',
                nameoftrend4: trends[3] || '',
                nameoftrend5: trends[4] || '',
            },
            ipAddress,
            dateTime: istDateTime, 
        };

        const result = await collection.insertOne(record);

        const jsonExtract = {
            _id: result.insertedId,
            ...record.trends,
        };

        res.json({
            dateTime: istDateTime, 
            ipAddress,
            trends,
            jsonExtract,
        });
    } catch (error) {
        console.error('Error occurred:', error);
        res.status(500).json({ error: 'An error occurred while running the script.' });
    } finally {
        if (client) {
            client.close();
        }
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
