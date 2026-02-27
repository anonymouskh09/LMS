import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import TeacherSignIn from './pages/TeacherSignIn'
import Courses from './pages/Courses'
import Analytics from './pages/Analytics'
import StudentAssignments from './pages/StudentAssignments'
import PendingStudents from './pages/PendingStudents'
import ApplyPage from './pages/ApplyPage'
import Chat from './pages/Chat'

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
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
