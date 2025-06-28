import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        completed: {
            type: Boolean,
            default: false,
        },
            completedAt: {
            type: Date,
            default: null,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);