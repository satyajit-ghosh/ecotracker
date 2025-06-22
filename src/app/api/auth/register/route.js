import dbConnect from '@/config/database';
import User from '@/models/user';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const userSchema = z.object({
  name: z.string().trim().max(100),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6),
});

export async function POST(request) {
  try {
    await dbConnect();

    // Parse and validate once
    const body = await request.json();
    const validatedData = userSchema.parse(body);

    // Check if email exists
    const existing = await User.findOne({ email: validatedData.email });
    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Email already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    });

    return new Response(
      JSON.stringify({ message: 'User registered' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
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
