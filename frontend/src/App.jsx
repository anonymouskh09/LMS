import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import TeacherSignIn from './pages/TeacherSignIn'
import Courses from './pages/Courses'
import Analytics from './pages/Analytics'
import StudentAssignments from './pages/StudentAssignments'
import PendingStudents from './pages/PendingStudents'
import ApplyPage from './pages/ApplyPage'
import LabPlayer from './pages/LabPlayer'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import Chat from './pages/Chat'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        
        {/* Public Routes - Only accessible if NOT logged in */}
        <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
        <Route path="/teacher/signin" element={<PublicRoute><TeacherSignIn /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        {/* Protected Routes - Only accessible if logged in */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/teacher/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute><Courses /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/assignments" element={<ProtectedRoute><StudentAssignments /></ProtectedRoute>} />
        <Route path="/pending-students" element={<ProtectedRoute><PendingStudents /></ProtectedRoute>} />
        <Route path="/labs/:labId" element={<ProtectedRoute><LabPlayer /></ProtectedRoute>} />
        
        {/* Miscellaneous */}
        <Route path="/teacher/signin" element={<TeacherSignIn />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/teacher/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/assignments" element={<StudentAssignments />} />
        <Route path="/pending-students" element={<PendingStudents />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/apply/:jobId" element={<ApplyPage />} />
      </Routes>
    </Router>
  )
}

export default App
