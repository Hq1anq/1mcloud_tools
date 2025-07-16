import { setupDb } from '../config/database.js'

export async function getAllUsers() {
    const { connection, dbAvailable } = await setupDb();
    let [results, fields] = await connection.query('SELECT * FROM Users');
    return results;
}