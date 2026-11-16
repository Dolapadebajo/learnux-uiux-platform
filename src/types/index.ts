/* Domain types. Shaped like an API response so a backend can replace src/data later. */
export type Role = 'learner' | 'instructor' | 'admin';
export type ID = string;

export interface User {
  id: ID; name: string; email: string; role: Role; status: 'active' | 'suspended' | 'invited';
  joined: string; initials: string; bio?: string; headline?: string; location?: string;
  certificateName?: string;
}

export type LessonType = 'video' | 'reading';
export interface Lesson { id: ID; title: string; type: LessonType; minutes: number; required: boolean; summary: string; transcript: { t: string; text: string }[]; resources: { name: string; size: string; available: boolean }[]; }
export interface Module { id: ID; title: string; lessons: Lesson[]; }

export interface QuizQuestion { id: ID; prompt: string; options: string[]; answer: number; explanation: string; }
export interface RubricCriterion { id: ID; name: string; max: number; description: string; }
export interface Assessment {
  id: ID; courseId: ID; kind: 'quiz' | 'assignment'; title: string; required: boolean; graded: boolean;
  passMark: number; maxAttempts: number; afterModuleId: ID; description: string;
  questions?: QuizQuestion[]; brief?: string; rubric?: RubricCriterion[];
}

export type CourseStatus = 'draft' | 'in_review' | 'changes_requested' | 'published';
export interface Course {
  id: ID; title: string; subtitle: string; category: string; level: 'Beginner' | 'Intermediate' | 'Advanced';
  price: number; instructorId: ID; weeks: number; hoursPerWeek: string; liveSchedule: string; nextStart: string;
  learners: number; rating: number | null; reviews: number; outcomes: string[]; prerequisites: string; description: string;
  status: CourseStatus; modules: Module[]; assessmentIds: ID[]; updatedAt: string; reviewNotes?: ReviewNote[]; cover: string;
}
export interface ReviewNote { id: ID; at: string; by: ID; items: string[]; decision: 'changes_requested' | 'approved'; }

export interface Enrolment {
  id: ID; userId: ID; courseId: ID; status: 'active' | 'expired' | 'refunded' | 'pending_payment';
  enrolledAt: string; accessUntil: string; completedLessonIds: ID[]; lastLessonId?: ID; lastPosition?: string;
}

export interface QuizAttempt { id: ID; userId: ID; assessmentId: ID; answers: number[]; score: number; submittedAt: string; mode: 'graded' | 'practice'; }

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'revision_requested';
export interface Submission {
  id: ID; userId: ID; assessmentId: ID; version: number; status: SubmissionStatus;
  files: { name: string; size: string }[]; note: string; submittedAt?: string;
  scores?: Record<ID, number>; score?: number; feedback?: string; published: boolean; gradedBy?: ID; gradedAt?: string;
  history: { version: number; submittedAt: string; score?: number }[];
}

export type PaymentMethod = 'card' | 'bank_transfer' | 'ussd';
export type TxnStatus = 'successful' | 'pending' | 'failed' | 'refunded';
export interface Transaction {
  id: ID; userId: ID; courseId: ID; amount: number; listPrice: number; discount: number; method: PaymentMethod;
  status: TxnStatus; createdAt: string; receiptNo?: string; failureReason?: string; providerRef: string; cardLast4?: string;
  events: { at: string; label: string }[];
}

export type RefundStatus = 'submitted' | 'approved' | 'declined' | 'completed';
export interface Refund {
  id: ID; txnId: ID; userId: ID; courseId: ID; reason: string; details: string; status: RefundStatus;
  createdAt: string; decisionNote?: string; decidedBy?: ID; history: { at: string; label: string }[];
}

export interface Reply { id: ID; authorId: ID; body: string; at: string; }
export interface Thread { id: ID; courseId: ID; authorId: ID; title: string; body: string; at: string; pinned?: boolean; replies: Reply[]; }

export interface Notification { id: ID; userId: ID; kind: 'announcement' | 'grade' | 'payment' | 'support' | 'certificate' | 'course'; title: string; body: string; link: string; read: boolean; at: string; }
export interface Announcement { id: ID; courseId: ID; authorId: ID; title: string; body: string; at: string; emailed: boolean; }

export type TicketStatus = 'open' | 'awaiting_learner' | 'resolved';
export interface TicketMessage { id: ID; authorId: ID; body: string; at: string; internal?: boolean; }
export interface Ticket { id: ID; userId: ID; subject: string; category: string; status: TicketStatus; priority: 'normal' | 'high'; assigneeId?: ID; relatedRef?: string; createdAt: string; messages: TicketMessage[]; }

export interface Certificate { id: ID; userId: ID; courseId: ID; issuedAt: string; status: 'valid' | 'revoked'; nameOnCertificate: string; revokedReason?: string; revokedAt?: string; version: number; }

export interface AuditEntry { id: ID; at: string; actorId: ID; action: string; target: string; detail: string; }

export interface PlatformSettings {
  promoEnabled: boolean; promoPercent: number; promoEnds: string; supportEmail: string;
  bankTransferHours: number; ussdMinutes: number; revisionWindowDays: number; maintenanceNotice: string;
  methods: Record<PaymentMethod, boolean>;
}

export interface Session { userId: ID | null; pendingSignup?: { name: string; email: string; verified: boolean; courseId?: ID }; }

export interface DB {
  version: number; session: Session; users: User[]; courses: Course[]; assessments: Assessment[]; enrolments: Enrolment[];
  quizAttempts: QuizAttempt[]; submissions: Submission[]; transactions: Transaction[]; refunds: Refund[];
  threads: Thread[]; notifications: Notification[]; announcements: Announcement[]; tickets: Ticket[];
  certificates: Certificate[]; audit: AuditEntry[]; settings: PlatformSettings;
  profile: Record<ID, { captions: boolean; transcript: boolean; autoplay: boolean; reducedMotion: boolean; emailGrades: boolean; emailAnnouncements: boolean; emailReminders: boolean; emailNews: boolean; timezone: string }>;
}
