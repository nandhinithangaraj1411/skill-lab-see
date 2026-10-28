import { Router } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task.js';

const router = Router();

const EDITABLE_FIELDS = ['title', 'description', 'status', 'priority', 'dueDate', 'estimatedMinutes'];

// Keep only fields clients are allowed to set (ignores _id, createdAt, etc.)
function pickEditable(body = {}) {
  const data = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  // Treat empty string as "no due date"
  if (data.dueDate === '') data.dueDate = null;
  if (data.estimatedMinutes === '') data.estimatedMinutes = null;
  // Record when a task was completed (powers "completed today" stats)
  if (data.status !== undefined) {
    data.completedAt = data.status === 'completed' ? new Date() : null;
  }
  return data;
}

function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    const err = new Error('Invalid task id');
    err.status = 400;
    throw err;
  }
}

function notFound() {
  const err = new Error('Task not found');
  err.status = 404;
  return err;
}

// GET /api/tasks — newest first
router.get('/', async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const task = await Task.create(pickEditable(req.body));
  res.status(201).json(task);
});

// PATCH /api/tasks/:id — partial update (e.g. move status)
router.patch('/:id', async (req, res) => {
  assertValidId(req.params.id);
  const updates = pickEditable(req.body);
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: `Provide at least one of: ${EDITABLE_FIELDS.join(', ')}` });
  }
  const task = await Task.findByIdAndUpdate(req.params.id, updates, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!task) throw notFound();
  res.json(task);
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  assertValidId(req.params.id);
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw notFound();
  res.json({ message: 'Task deleted', id: task._id });
});

export default router;
