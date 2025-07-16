import { setupDb } from '../config/database.js'
// import { getAllUsers } from '../services/CRUDService.js'

// export async function getHomePage(req, res) {
//     let results = await getAllUsers();
//     return res.render('home', { listUsers: results });
// }

export function getHomePage(req, res) {
    return res.render('home', { listUsers: [] });
}

export function getCreatePage(req, res) {
    return res.render('create');
}

export function getUpdatePage(req, res) {
    return res.render('edit');
}

export async function postCreateUser(req, res) {
    // Logic to create a user can be added here
    let {email, name, password} = req.body;

    const { connection, dbAvailable } = await setupDb();

    let [results, fields] = await connection.query(
        'INSERT INTO Users (email, name, password) VALUES (?, ?, ?)'
        , [email, name, password]
    );

    res.send('User created successfully');
}