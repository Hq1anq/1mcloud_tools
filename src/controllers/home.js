import connection from "../config/database.js";

const getHomePage = (req, res) => {
    return res.render('home'); // This will render views/home.ejs
}

const getCreatePage = (req, res) => {
    return res.render('create'); // This will render views/create.ejs
}

const postCreateUser = (req, res) => {
    // Logic to create a user can be added here
    let {email, name, password} = req.body;
    connection.query(
        'INSERT INTO Users (email, name, password) VALUES (?, ?, ?)',
        [email, name, password],
        function (error, results) {
            if (error) {
                console.error('Error creating user:', error);
                res.send('User created failed');
                return res.status(500).send('Error creating user');
            }
            res.send('User created successfully');
        }
    );
}

export { getHomePage, postCreateUser, getCreatePage };