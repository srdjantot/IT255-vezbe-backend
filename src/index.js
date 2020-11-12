require('dotenv').config();
const express = require('express');
const cors = require('cors')
const sqlite3 = require('sqlite3');

const dbFile = 'data.db';
const dbExists = require('fs').existsSync(dbFile);

console.log(`Opening database...`);
const db = new sqlite3.Database('data.db');

if (!dbExists) {
    db.serialize(() => {
        db
            .run('CREATE TABLE Recipes (username TEXT PRIMARY KEY, password TEXT, data TEXT)')
            .run(`INSERT INTO Recipes (username, password) VALUES ('__public__', '__public__')`);
    });
}

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', function (req, res) {
    res.send('Recipe app server')
});

app.post('/login', function (req, res) {
    db.get('SELECT username FROM Recipes WHERE username = ? AND password = ?', [req.body.username, req.body.password], (error, row) => {
        if (error) {
            res.status(500).send({ error: error });
        } else if (row) {
            res.send({ username: row.username });
        } else {
            res.status(401).send({ message: 'Invalid username and/or password' });
        }
    });
});

app.post('/register', function (req, res) {
    db.run('INSERT INTO Recipes (username, password) VALUES (?, ?)', [req.body.username, req.body.password], (error) => {
        if (error) {
            res.status(500).send({ error: error });
        } else {
            res.send({ username: req.body.username });
        }
    });
});

app.get('/data', function (req, res) {
    const username = req.query.username || '__public__';
    db.get('SELECT username, data FROM Recipes WHERE username = ?', [username], (error, row) => {
        if (error) {
            res.status(500).send({ error: error });
        } else if (row && row.username) {
            res.send(JSON.parse(row.data));
        } else {
            res.status(401).send({ message: 'Invalid username' });
        }
    });
});

app.put('/data', function (req, res) {
    const username = req.body.username || '__public__';
    db.run('UPDATE Recipes SET data = ? WHERE username = ?', [JSON.stringify(req.body.data), username], function (error) {
        if (error) {
            res.status(500).send({ error: error });
        }
        else if (this.changes === 1) {
            res.send();
        } else {
            res.status(401).send({ message: 'Invalid username' });
        }
    });
});

const listener = app.listen(process.env.PORT, () => {
    console.log(`App is listening on port ${listener.address().port}`);
});