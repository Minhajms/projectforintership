const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create schema for todo
const TaskSchema = new Schema({
  action: {
    type: String,
    required: [true, 'The task text field is required'],
  },
});

// Create model for todo
const Task = mongoose.model('task', TaskSchema);

module.exports = Task;