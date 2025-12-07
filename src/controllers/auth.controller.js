// controllers/auth.controller.js
import User from '../models/user.model.js'

// Save or update a user when logging in
export async function saveOrUpdateUser(email, apiKey, username) {
  if (!email || !apiKey) throw new Error('Missing email or API key')

  // Check if user already exists
  const existingUser = await User.findOne({ email })

  if (!existingUser) {
    // INSERT new user
    const newUser = await User.create({
      email,
      access_token: apiKey,
      username: username || email.split('@')[0], // default username
    })

    return {
      created: true,
      updated: false,
      user: newUser,
    }
  }

  // UPDATE existing user
  existingUser.access_token = apiKey
  await existingUser.save()

  return {
    created: false,
    updated: true,
    user: existingUser,
  }
}
