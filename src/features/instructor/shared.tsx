import { useParams } from 'react-router-dom';
import { useSession } from '../../hooks/useSession';
import { courseById } from '../../data/selectors';
import { NavTabs, Breadcrumbs } from '../../components/ui/navigation';
import { StatusBadge, type Tone } from '../../components/ui/feedback';
import type { CourseStatus } from '../../types';

export const courseStatusLabel: Record<CourseStatus, string> = { draft: 'Draft', in_review: 'In review', changes_requested: 'Changes requested', published: 'Published' };
export const courseStatusTone: Record<CourseStatus, Tone> = { draft: 'neutral', in_review: 'info', changes_requested: 'warning', published: 'success' };
export const CourseStatusBadge = ({ status }: { status: CourseStatus }) => <StatusBadge tone={courseStatusTone[status]}>{courseStatusLabel[status]}</StatusBadge>;

/** The instructor's courses only — instructors never see other instructors' courses. */
export function useInstructorCourse() {
  const { courseId } = useParams(); const { db, user } = useSession();
  const c = courseById(db, courseId);
  return { db, user: user!, course: c && c.instructorId === user!.id ? c : undefined };
}
export function CourseWorkspaceNav({ courseId, title }: { courseId: string; title: string }) {
  return (
    <>
      <Breadcrumbs items={[['Courses', '/teach/courses'], [title]]} />
      <NavTabs label="Course tools" className="subnav" items={[
        { to: `/teach/courses/${courseId}/settings`, label: 'Settings' }, { to: `/teach/courses/${courseId}/curriculum`, label: 'Curriculum' },
        { to: `/teach/courses/${courseId}/assessments`, label: 'Assessments' }, { to: `/teach/courses/${courseId}/learners`, label: 'Learners' },
        { to: `/teach/courses/${courseId}/announcements`, label: 'Announcements' }, { to: `/teach/courses/${courseId}/analytics`, label: 'Analytics' }]} />
    </>
  );
}
