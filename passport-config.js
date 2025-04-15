const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const db = require('./db');

function initialize(passport) {
    const authenticateUser = (username, password, done) => {
        db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
            if (err) return done(err);
            if (results.length === 0) return done(null, false, { message: 'No user found' });

            const user = results[0];
            try {
                if (await bcrypt.compare(password, user.password)) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Incorrect password' });
                }
            } catch (e) {
                return done(e);
            }
        });
    };

    passport.use(new LocalStrategy(authenticateUser));
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser((id, done) => {
        db.query('SELECT * FROM users WHERE id = ?', [id], (err, results) => {
            if (err) return done(err);
            done(null, results[0]);
        });
    });
}

module.exports = initialize;
