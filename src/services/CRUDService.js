import connection from '../config/database.js'

export async function getAllUsers() {
    let [results, fields] = await connection.query('SELECT * FROM Users');
    return results;
}