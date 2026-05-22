const mongoose = require('mongoose');

const clearDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/taskmanager');
    console.log('Connected to DB');
    await mongoose.connection.db.collection('tasks').deleteMany({});
    await mongoose.connection.db.collection('users').deleteMany({});
    await mongoose.connection.db.collection('companies').deleteMany({});
    console.log('Tasks, Users, and Companies collections emptied successfully');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

clearDB();
