import { useEffect, useRef, type ReactNode } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ToastProvider } from '../components/ui/feedback';
import { AuthLayout, PublicLayout, WorkspaceLayout } from '../components/layout/layouts';
import { DemoBar } from './DemoBar';
import { RequireRole } from './guards';
import { Home } from '../features/public/Home';
import { Catalogue } from '../features/public/Catalogue';
import { CourseDetails } from '../features/public/CourseDetails';
import { HelpArticle, HelpCentre } from '../features/public/Help';
import { VerifyCertificate } from '../features/public/Verify';
import { NotFound } from '../features/public/System';
import { Checkout, PaymentStatus } from '../features/public/Checkout';
import { ForgotPassword, Login, ResetPassword, Signup, VerifyEmail } from '../features/auth/AuthViews';
import { LearnerDashboard } from '../features/learner/Dashboard';
import { MyCourses, CourseOverview } from '../features/learner/Courses';
import { LessonPlayer } from '../features/learner/LessonPlayer';
import { CourseAssessments, QuizView, QuizResults } from '../features/learner/Quiz';
import { AssignmentFeedback, AssignmentSubmission } from '../features/learner/Assignment';
import { LearningProgress } from '../features/learner/Progress';
import { Discussions, DiscussionThread } from '../features/learner/Discussions';
import { CertificateDetails, MyCertificates } from '../features/learner/Certificates';
import { PaymentHistory, RefundRequest, TransactionReceipt } from '../features/learner/Payments';
import { AccountSettings, Notifications, Profile } from '../features/learner/Account';
import { ContactSupport, SupportList, TicketConversation } from '../features/learner/Support';
import { InstructorDashboard } from '../features/instructor/Dashboard';
import { CourseManagement, CourseSettings } from '../features/instructor/Courses';
import { CurriculumBuilder, LessonEditor } from '../features/instructor/Curriculum';
import { AssessmentBuilder } from '../features/instructor/AssessmentBuilder';
import { GradingWorkspace, SubmissionQueue } from '../features/instructor/Grading';
import { CourseLearners, LearnerDetail } from '../features/instructor/Learners';
import { Announcements } from '../features/instructor/Announcements';
import { Analytics } from '../features/instructor/Analytics';
import { AdminDashboard } from '../features/admin/Dashboard';
import { RolesPermissions, UserDetails, UserManagement } from '../features/admin/Users';
import { CourseReview, CourseReviewQueue } from '../features/admin/CourseReview';
import { EnrolmentManagement } from '../features/admin/Enrolments';
import { TransactionDetails, TransactionList } from '../features/admin/Transactions';
import { RefundReview } from '../features/admin/Refunds';
import { StaffTicket, SupportQueue } from '../features/admin/Support';
import { CertificateManagement, CertificateRecord } from '../features/admin/Certificates';
import { PlatformReports } from '../features/admin/Reports';
import { PlatformSettings } from '../features/admin/Settings';
import { Showcase } from '../features/dev/Showcase';
import { Coverage } from '../features/dev/Coverage';

/** Moves to the top and focuses <main> on route change so screen-reader users hear the new page. */
function RouteEffects() {
  const { pathname } = useLocation(); const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } window.scrollTo(0, 0); const m = document.getElementById('main'); if (m && document.activeElement !== m && !document.activeElement?.closest('[role="dialog"]')) m.focus({ preventScroll: true }); }, [pathname]);
  return null;
}
const Learner = ({ children }: { children?: ReactNode }) => <RequireRole role="learner">{children ?? <WorkspaceLayout role="learner" />}</RequireRole>;

export function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to main content</a>
        <DemoBar />
        <RouteEffects />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/courses" element={<Catalogue />} />
            <Route path="/courses/:courseId" element={<CourseDetails />} />
            <Route path="/help" element={<HelpCentre />} />
            <Route path="/help/:slug" element={<HelpArticle />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            <Route path="/verify/:ref" element={<VerifyCertificate />} />
            <Route path="/checkout/:courseId" element={<Checkout />} />
            <Route path="/checkout/:courseId/status/:txnId" element={<PaymentStatus />} />
            <Route path="/showcase" element={<Showcase />} />
            <Route path="/coverage" element={<Coverage />} />
          </Route>
          <Route element={<AuthLayout />}>
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="/learn" element={<Learner />}>
            <Route index element={<LearnerDashboard />} />
            <Route path="courses" element={<MyCourses />} />
            <Route path="courses/:courseId" element={<CourseOverview />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonPlayer />} />
            <Route path="courses/:courseId/assessments" element={<CourseAssessments />} />
            <Route path="courses/:courseId/quiz/:assessmentId" element={<QuizView />} />
            <Route path="courses/:courseId/quiz/:assessmentId/results" element={<QuizResults />} />
            <Route path="courses/:courseId/assignment/:assessmentId" element={<AssignmentSubmission />} />
            <Route path="courses/:courseId/assignment/:assessmentId/feedback" element={<AssignmentFeedback />} />
            <Route path="courses/:courseId/discussions" element={<Discussions />} />
            <Route path="courses/:courseId/discussions/:threadId" element={<DiscussionThread />} />
            <Route path="progress" element={<LearningProgress />} />
            <Route path="certificates" element={<MyCertificates />} />
            <Route path="certificates/:courseId" element={<CertificateDetails />} />
            <Route path="payments" element={<PaymentHistory />} />
            <Route path="payments/:txnId" element={<TransactionReceipt />} />
            <Route path="payments/:txnId/refund" element={<RefundRequest />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<AccountSettings />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="support" element={<SupportList />} />
            <Route path="support/new" element={<ContactSupport />} />
            <Route path="support/:ticketId" element={<TicketConversation />} />
          </Route>
          <Route path="/teach" element={<RequireRole role="instructor"><WorkspaceLayout role="instructor" /></RequireRole>}>
            <Route index element={<InstructorDashboard />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="courses/:courseId/settings" element={<CourseSettings />} />
            <Route path="courses/:courseId/curriculum" element={<CurriculumBuilder />} />
            <Route path="courses/:courseId/lessons/:lessonId" element={<LessonEditor />} />
            <Route path="courses/:courseId/assessments" element={<AssessmentBuilder />} />
            <Route path="courses/:courseId/learners" element={<CourseLearners />} />
            <Route path="courses/:courseId/learners/:userId" element={<LearnerDetail />} />
            <Route path="courses/:courseId/announcements" element={<Announcements />} />
            <Route path="courses/:courseId/analytics" element={<Analytics />} />
            <Route path="submissions" element={<SubmissionQueue />} />
            <Route path="submissions/:submissionId" element={<GradingWorkspace />} />
          </Route>
          <Route path="/admin" element={<RequireRole role="admin"><WorkspaceLayout role="admin" /></RequireRole>}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="users/:userId" element={<UserDetails />} />
            <Route path="roles" element={<RolesPermissions />} />
            <Route path="courses" element={<CourseReviewQueue />} />
            <Route path="courses/:courseId" element={<CourseReview />} />
            <Route path="enrolments" element={<EnrolmentManagement />} />
            <Route path="transactions" element={<TransactionList />} />
            <Route path="transactions/:txnId" element={<TransactionDetails />} />
            <Route path="refunds" element={<RefundReview />} />
            <Route path="support" element={<SupportQueue />} />
            <Route path="support/:ticketId" element={<StaffTicket />} />
            <Route path="certificates" element={<CertificateManagement />} />
            <Route path="certificates/:certId" element={<CertificateRecord />} />
            <Route path="reports" element={<PlatformReports />} />
            <Route path="settings" element={<PlatformSettings />} />
          </Route>
          <Route element={<PublicLayout />}><Route path="*" element={<NotFound />} /></Route>
        </Routes>
      </ToastProvider>
    </HashRouter>
  );
}
