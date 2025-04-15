const express = require('express');
const session = require('express-session');
const passport = require('passport');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const conn = require('./db');
const initializePassport = require('./passport-config');
const app = express();

initializePassport(passport);

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'nehalmanas',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Middleware to protect routes
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// Routes
app.get('/', checkAuthenticated, (req, res) => {
    res.render('form');
});

app.post('/generate', checkAuthenticated, (req, res) => {
    const { name, email, phone, address, education, experience, skills, layout } = req.body;
    const userId = req.user.id;

    const sql = 'INSERT INTO resumes (user_id, name, email, phone, address, education, experience, skills) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    conn.query(sql, [userId, name, email, phone, address, education, experience, skills], (err) => {
        if (err) throw err;

        const resumeData = { name, email, phone, address, education, experience, skills };
        if (layout === 'one') {
            res.render('resume1', { resume: resumeData });
        } else {
            res.render('resume2', { resume: resumeData });
        }
    });
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    conn.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
        if (err) {
            req.flash('error', 'Username already taken');
            return res.redirect('/register');
        }
        res.redirect('/login');
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
