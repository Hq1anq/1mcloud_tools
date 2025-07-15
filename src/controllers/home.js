import connection from '../config/database.js'
import { getAllUsers } from '../services/CRUDService.js'

export async function getHomePage(req, res) {
    let results = await getAllUsers();
    return res.render('home', { listUsers: results });
}

// export function getHomePage(req, res) {
//     return res.render('home', { listUsers: [] });
// }

export function getCreatePage(req, res) {
    return res.render('create'); // This will render views/create.ejs
}

export async function postCreateUser(req, res) {
    // Logic to create a user can be added here
    let {email, name, password} = req.body;

    let [results, fields] = await connection.query(
        'INSERT INTO Users (email, name, password) VALUES (?, ?, ?)'
        , [email, name, password]
    );

    res.send('User created successfully');
}