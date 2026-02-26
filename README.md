# University LMS - Learning Management System

A comprehensive, modern Learning Management System designed for universities with role-based access for Admins, Teachers, and Students.

## 🎯 Features

### 👨‍💼 Admin Dashboard
- **User Management**: Create, edit, and delete teachers and students
- **Student Approval System**: Review and approve/reject student registrations
- **Course Management**: Manage courses, subjects, and class assignments
- **Analytics**: Overview of system statistics and user data
- **Teacher Assignment**: Assign courses and subjects to teachers

### 👨‍🏫 Teacher Dashboard
- **Course Management**: Create custom courses and manage assigned subjects
- **Attendance System**: Mark and track student attendance for each subject
- **Grades Management**: Enter and manage student grades
- **Progress Reports**: Generate detailed progress reports with remarks
- **Student Overview**: View all students in assigned classes

### 👨‍🎓 Student Dashboard
- **Course Access**: View enrolled courses and subjects
- **Attendance Tracking**: Check attendance records for all subjects
- **Grades View**: Access grades and performance metrics
- **Progress Reports**: View detailed progress reports with teacher remarks
- **Fee Challan**: Access and download fee challans
- **Timetable**: Auto-generated class timetable

### 🔐 Authentication & Security
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- Student approval workflow
- Password reset via email
- Secure session management
- Protected API routes

### 🎨 Modern UI/UX
- Glassmorphism design effects
- Responsive layouts
- Professional data visualization
- Clean and intuitive navigation
- Real-time updates

## 🛠️ Tech Stack

**Frontend:**
- React 18 with Vite
- React Router for navigation
- TailwindCSS for styling
- Phosphor Icons
- Custom CSS with glassmorphism effects

**Backend:**
- Node.js & Express.js
- MySQL Database
- JWT for authentication
- Nodemailer for email services
- Multer for file uploads
- bcrypt for password hashing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MySQL Server
- XAMPP or similar local server

### 1. Database Setup
1. Start XAMPP and run MySQL
2. Open phpMyAdmin: http://localhost/phpmyadmin
3. Create a new database named `lms_db`
4. Import the database:
   - Go to the `lms_db` database
   - Click "Import" tab
   - Select `backend/COMPLETE_DATABASE.sql`
   - Click "Go"

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```
✅ Backend runs at: **http://localhost:5000**

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
✅ Frontend runs at: **http://localhost:5173**

## 🔑 Default Login Credentials

### Admin Account
- **Email**: admin@university.com
- **Password**: admin123

### Teacher Account (Sample)
- Create via Admin Dashboard

### Student Account (Sample)
- Sign up and wait for admin approval

## 📁 Project Structure

```
LMS/
├── backend/
│   ├── api/              # API routes
│   ├── config/           # Database configuration
│   ├── middleware/       # Auth middleware
│   ├── migrations/       # Database migrations
│   ├── uploads/          # Uploaded files
│   ├── server.js         # Main server file
│   └── COMPLETE_DATABASE.sql
│
├── frontend/
│   ├── src/
│   │   ├── pages/        # All page components
│   │   ├── App.jsx       # Main app component
│   │   ├── main.jsx      # Entry point
│   │   ├── index.css     # Global styles
│   │   └── custom-styles.css
│   └── index.html
│
└── README.md
```

## 🚀 Usage Guide

### For Admins
1. Login with admin credentials
2. Navigate to "Students" or "Teachers" to manage users
3. Review pending student approvals in the Approve tab
4. Assign courses to teachers from the dashboard
5. Monitor system analytics

### For Teachers
1. Wait for admin to create your account
2. Login with provided credentials
3. View assigned courses on dashboard
4. Mark attendance for students
5. Enter grades and create progress reports
6. Add remarks for individual students

### For Students
1. Sign up using the registration form
2. Wait for admin approval
3. Login after approval
4. Access courses and view subjects
5. Check attendance and grades
6. Download fee challans and view timetable

## 🔧 Configuration

### Backend Environment Variables
Create a `.env` file in the `backend` directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=lms_db
JWT_SECRET=your_secret_key_here
PORT=5000
```

### Email Configuration
Update email settings in backend for password reset functionality.

## 🐛 Troubleshooting

**Database Connection Error:**
- Ensure MySQL is running in XAMPP
- Check database credentials in `.env` file
- Verify database name matches `lms_db`

**Port Already in Use:**
- Backend: Change PORT in `.env` file
- Frontend: Change port in `vite.config.js`

**JWT Token Errors:**
- Clear browser localStorage
- Login again

## 📝 Features Implemented

✅ Admin Dashboard with full user management  
✅ Teacher Dashboard with course creation  
✅ Student Dashboard with course access  
✅ Attendance system (subject-wise)  
✅ Grades management  
✅ Progress reports with remarks  
✅ Fee challan generation  
✅ Auto-generated timetables  
✅ Student approval workflow  
✅ Password reset via email  
✅ Role-based authentication  
✅ Modern, professional UI  

## 📄 License

This project is developed for educational purposes.

## 👨‍💻 Support

For issues or questions, please contact the development team.
