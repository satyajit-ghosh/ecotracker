import dbConnect from '@/config/database';
import User from '@/models/user';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/utils/tokenGeneration';

// Zod schema for login
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

export async function POST(request) {
  try {
    await dbConnect();

    // 1. Parse JSON body
    const body = await request.json();

    // 2. Validate
    const { email, password } = loginSchema.parse(body);

    // 3. Find user and include password field (select: false in Mongoose)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return new Response(
        JSON.stringify({ message: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // 5. Login success (you can add JWT or session logic here)
    return new Response(
      JSON.stringify({
        message: 'Login successful',
        accessToken: generateToken({ id: user._id}),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      // This happens if JSON is empty or malformed
      return new Response(
        JSON.stringify({ message: 'Invalid or empty JSON body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (error instanceof z.ZodError) {
      // Validation errors (missing fields, wrong types, etc.)
      return new Response(
        JSON.stringify({ errors: error.errors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    // Other unexpected errors
    return new Response(
      JSON.stringify({ message: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
