import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { connectDB } from './db.js';
import { Task } from './models/Task.js';

const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

const sampleTasks = [
  { title: 'Set up project repository', description: 'Initialize Git repo and folder structure.', status: 'completed', priority: 'high', dueDate: daysFromNow(-3) },
  { title: 'Design database schema', description: 'Define the Task model fields and validation rules.', status: 'completed', priority: 'high', dueDate: daysFromNow(-2) },
  { title: 'Build REST API', description: 'Implement CRUD endpoints for tasks with Express.', status: 'completed', priority: 'medium', dueDate: daysFromNow(-1) },
  { title: 'Create Kanban board UI', description: 'Three columns: To Do, In Progress, Completed.', status: 'in-progress', priority: 'high', dueDate: daysFromNow(1) },
  { title: 'Add dashboard statistics', description: 'Show total, pending, in-progress and completed counts.', status: 'in-progress', priority: 'medium', dueDate: daysFromNow(2) },
  { title: 'Style task cards', description: 'Priority badges, due dates and hover states.', status: 'in-progress', priority: 'low', dueDate: null },
  { title: 'Write README', description: 'Document setup steps and API endpoints.', status: 'todo', priority: 'medium', dueDate: daysFromNow(4) },
  { title: 'Test API endpoints', description: 'Verify GET, POST, PATCH and DELETE against MongoDB.', status: 'todo', priority: 'high', dueDate: daysFromNow(3) },
  { title: 'Handle loading and error states', description: 'Show friendly messages when the API is unreachable.', status: 'todo', priority: 'medium', dueDate: null },
  { title: 'Prepare demo', description: 'Walk through creating, moving and deleting tasks.', status: 'todo', priority: 'low', dueDate: daysFromNow(5) },
];

// Inserts sample tasks only when the collection is empty.
export async function seedIfEmpty() {
  const count = await Task.countDocuments();
  if (count > 0) {
    console.log(`Seed skipped: tasks collection already has ${count} document(s).`);
    return 0;
  }
  await Task.insertMany(sampleTasks);
  console.log(`Seeded ${sampleTasks.length} sample tasks.`);
  return sampleTasks.length;
}

// Allow running directly: npm run seed
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDB(process.env.MONGO_URI);
    await seedIfEmpty();
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
