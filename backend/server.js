const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'University LMS Backend API is running',
    version: '1.0.0'
  });
});

console.log('Loading routes...');

try {
  // Routes - load one by one to find the issue
  console.log('Loading auth routes...');
  app.use('/api', require('./api/auth'));
  console.log('✓ Auth routes loaded');
  
  console.log('Loading forgot password routes...');
  app.use('/api', require('./api/forgotPassword'));
  console.log('✓ Forgot password routes loaded');
  
  console.log('Loading users routes...');
  app.use('/api/users', require('./api/users'));
  console.log('✓ Users routes loaded');
  
  console.log('Loading teachers routes...');
  app.use('/api/teachers', require('./api/teachers'));
  console.log('✓ Teachers routes loaded');
  
  console.log('Loading courses routes...');
  app.use('/api/courses', require('./api/courses'));
  console.log('✓ Courses routes loaded');
  
  console.log('Loading assignments routes...');
  app.use('/api/assignments', require('./api/assignmentFiles'));
  console.log('✓ Assignments routes loaded');
  
  console.log('Loading submissions routes...');
  app.use('/api/assignments', require('./api/assignments'));
  console.log('✓ Assignments routes loaded');
  
  app.use('/api/submissions', require('./api/studentSubmissions'));
  console.log('✓ Submissions routes loaded');
  
  console.log('Loading admin routes...');
  app.use('/api/admin', require('./api/admin'));
  console.log('✓ Admin routes loaded');
  
  console.log('Loading HOD routes...');
  app.use('/api/principal', require('./api/principal'));
  console.log('✓ HOD routes loaded');
  
  console.log('Loading super admin routes...');
  app.use('/api/superadmin', require('./api/superadmin'));
  console.log('✓ Super Admin routes loaded');
  
  console.log('Loading BD portal routes...');
  app.use('/api/bd', require('./api/bd'));
  console.log('✓ BD Portal routes loaded');
  
  console.log('Loading attendance routes...');
  app.use('/api/attendance', require('./api/attendance'));
  console.log('✓ Attendance routes loaded');
  
  console.log('Loading grades routes...');
  app.use('/api/grades', require('./api/grades'));
  console.log('✓ Grades routes loaded');
  
  console.log('Loading progress routes...');
  app.use('/api/progress', require('./api/progress'));
  console.log('✓ Progress routes loaded');
  
  console.log('Loading challans routes...');
  app.use('/api/challans', require('./api/challans'));
  console.log('✓ Challans routes loaded');
  
  console.log('Loading timetables routes...');
  app.use('/api/timetables', require('./api/timetables'));
  console.log('✓ Timetables routes loaded');
  
  console.log('Loading classes routes...');
  app.use('/api/classes', require('./api/classes'));
  console.log('✓ Classes routes loaded');
  
  console.log('Loading logs routes...');
  app.use('/api/logs', require('./api/logs'));
  console.log('✓ Logs routes loaded');

  console.log('Loading labs routes...');
  app.use('/api/labs', require('./api/labs'));
  console.log('✓ Labs routes loaded');

  console.log('Loading pending students routes...');
  app.use('/api/pending-students', require('./api/pending-students'));
  console.log('✓ Pending students routes loaded');

  console.log('Loading feedback routes...');
  app.use('/api/feedback', require('./api/feedback'));
  console.log('✓ Feedback routes loaded');
  
  console.log('\n✅ All routes loaded successfully!\n');
  
} catch (error) {
  console.error('\n❌ Error loading routes:');
  console.error(error);
  process.exit(1);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  try {
    const fs = require('fs');
    fs.appendFileSync('server_error.log', `${new Date().toISOString()} - Unhandled Error: ${err.message}\nStack: ${err.stack}\n`);
  } catch (logErr) {
    console.error('Failed to write to log file:', logErr);
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const startServer = async () => {
  // Test database connection first
  const dbConnected = await testConnection();
  
  if (!dbConnected) {
    console.error('⚠️  Server starting without database connection');
    console.error('⚠️  Please check your MySQL configuration');
  }

  // Log startup to file to verify write permissions
  try {
    const fs = require('fs');
    fs.appendFileSync('server_startup.log', `${new Date().toISOString()} - Server starting on port ${PORT}\n`);
    console.log('✅ Startup log written to server_startup.log');
  } catch (err) {
    console.error('❌ Failed to write to server_startup.log:', err);
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 University LMS Backend API`);
    console.log(`\nAvailable endpoints:`);
    console.log(`   POST http://localhost:${PORT}/api/signup`);
    console.log(`   POST http://localhost:${PORT}/api/signin`);
    console.log(`   POST http://localhost:${PORT}/api/teacher/signup`);
    console.log(`   POST http://localhost:${PORT}/api/teacher/signin`);
    console.log(`   GET  http://localhost:${PORT}/api/courses`);
    console.log(`   POST http://localhost:${PORT}/api/courses (create course)\n`);
  });
};

startServer();
