import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dbConnect from '@/config/database';
import Todo from '@/models/todo';

const JWT_SECRET = process.env.DB_JWT_SECRET;

export async function GET(request) {
  try {
    await dbConnect();

    // Auth header & token check...
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization token missing or malformed' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const userId = decoded.user || decoded.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID not found in token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse range query
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'today';

    // Calculate UTC start date
    const now = new Date();
    let startDate;

    switch (range) {
      case 'today':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        break;

      case 'this_week': {
        const dayOfWeek = now.getUTCDay(); // Sunday=0
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        startDate.setUTCDate(startDate.getUTCDate() - dayOfWeek);
        break;
      }

      case 'this_month':
        startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid range parameter' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Aggregate with userId as ObjectId and completedAt >= startDate
    const aggregation = await Todo.aggregate([
      {
        $match: {
          completed: true,
          completedAt: { $gte: startDate },
          user: userObjectId,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const labels = aggregation.map((item) => item._id);
    const data = aggregation.map((item) => item.count);

    return new Response(
      JSON.stringify({ labels, data, range }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in dashboard stats:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
