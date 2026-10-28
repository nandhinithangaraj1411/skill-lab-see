import mongoose from 'mongoose';

export const STATUSES = ['todo', 'in-progress', 'completed'];
export const PRIORITIES = ['low', 'medium', 'high'];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    status: {
      type: String,
      enum: { values: STATUSES, message: `Status must be one of: ${STATUSES.join(', ')}` },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: { values: PRIORITIES, message: `Priority must be one of: ${PRIORITIES.join(', ')}` },
      default: 'medium',
    },
    dueDate: {
      type: Date,
      default: null,
    },
    // Optional time estimate in minutes
    estimatedMinutes: {
      type: Number,
      min: [1, 'Estimate must be at least 1 minute'],
      max: [1440, 'Estimate must be at most 1440 minutes'],
      default: null,
    },
    // Set by the API whenever status changes to/from "completed"
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Explicit collection name: "tasks"
export const Task = mongoose.model('Task', taskSchema, 'tasks');
