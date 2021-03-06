const passport = require('passport');


module.exports = (app) => {
	app.get('/auth/google', passport.authenticate('google', {
		scope: ['profile', 'email']
	}));

	app.get(
		'/auth/google/callback',
		passport.authenticate('google'),
		(res, response) => {
			response.redirect('/')
		}
	);

	//get current user
	app.get('/api/current_user', (req, res) => {
		//user gets added to req.user from deserializer
		if (req.user === undefined) {
			res.send(undefined);
		} else {
			res.send(req.user);	
		}
	});

	app.get('/api/logout', (req, res) => {
		req.logout();
		res.send(req.user);
	});

};