import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.DB_JWT_SECRET; // set this in .env file

// Create JWT token
export function generateToken(payload, expiresIn = '7d') {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not defined');
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function validateToken(token)
{
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return decoded;
  } catch (err) {
    throw new Error('Invalid or expired token')
  }
}