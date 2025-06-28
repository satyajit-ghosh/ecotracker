import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "@/config/database";
import Todo from "@/models/todo";

const JWT_SECRET = process.env.DB_JWT_SECRET;

export async function GET(request) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization token missing or malformed" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.split(" ")[1];
    let decoded;

    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const userId = decoded.user || decoded.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID not found in token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today";

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setUTCDate(startOfWeek.getUTCDate() - startOfWeek.getUTCDay());
    const startOfMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
    );

    let selectedStartDate;
    let groupFormat;

    switch (range) {
      case "today":
        selectedStartDate = startOfToday;
        groupFormat = "%Y-%m-%d %H:00"; // Hourly
        break;
      case "this_week":
        selectedStartDate = startOfWeek;
        groupFormat = "%Y-%m-%d"; // Daily
        break;
      case "this_month":
        selectedStartDate = startOfMonth;
        groupFormat = "%Y-%m-%d"; // Daily
        break;
      case "this_year":
        selectedStartDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)); // January 1st, UTC
        groupFormat = "%Y-%m-%d"; // or '%Y-%m' if you want monthly bars
        break;
      case "all_time":
        selectedStartDate = new Date(0); // Start from epoch
        groupFormat = "%Y-%m-%d"; // Daily
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid range parameter" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    // Aggregation for chart data
    const aggregation = await Todo.aggregate([
      {
        $match: {
          completed: true,
          completedAt: { $gte: selectedStartDate },
          user: userObjectId,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: "$completedAt",
              timezone: "UTC",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const labels = aggregation.map((item) => item._id);
    const data = aggregation.map((item) => item.count);

    // Total counts for today/week/month
    const [todayCount, weekCount, monthCount, yearCount, allTimeCount] = await Promise.all([
      Todo.countDocuments({
        completed: true,
        completedAt: { $gte: startOfToday },
        user: userObjectId,
      }),
      Todo.countDocuments({
        completed: true,
        completedAt: { $gte: startOfWeek },
        user: userObjectId,
      }),
      Todo.countDocuments({
        completed: true,
        completedAt: { $gte: startOfMonth },
        user: userObjectId,
      }),
    ]);

    const completedTasks = {
      today: todayCount,
      this_week: weekCount,
      this_month: monthCount,
        this_year: yearCount,   
        all_time: allTimeCount,
    };

    return new Response(
      JSON.stringify({
        labels,
        data,
        range,
        completedTasks,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in dashboard stats:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
