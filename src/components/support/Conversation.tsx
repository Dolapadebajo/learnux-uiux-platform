import { useState } from 'react';
import { LuLock, LuSend } from 'react-icons/lu';
import type { DB, Ticket, TicketStatus } from '../../types';
import { formatDateTime } from '../../utils/format';
import { userById } from '../../data/selectors';
import { Avatar } from '../ui/data';
import { Badge, StatusBadge, type Tone } from '../ui/feedback';
import { Button } from '../ui/Button';
import { Checkbox, Textarea } from '../ui/form';
import { cx } from '../../utils/cx';

export const ticketTone: Record<TicketStatus, Tone> = { open: 'info', awaiting_learner: 'warning', resolved: 'success' };
export const ticketLabel = (s: TicketStatus, staff: boolean) => ({ open: staff ? 'Open — needs staff reply' : 'Open — with support', awaiting_learner: staff ? 'Awaiting learner' : 'Awaiting your reply', resolved: 'Resolved' }[s]);
export const TicketBadge = ({ status, staff = false }: { status: TicketStatus; staff?: boolean }) => <StatusBadge tone={ticketTone[status]}>{ticketLabel(status, staff)}</StatusBadge>;

/** Message thread. Internal notes are only rendered for staff (`staffView`). */
export function Conversation({ db, ticket, viewerId, staffView, onSend }: { db: DB; ticket: Ticket; viewerId: string; staffView?: boolean; onSend: (body: string, internal: boolean) => void }) {
  const [body, setBody] = useState(''); const [internal, setInternal] = useState(false); const [err, setErr] = useState('');
  const msgs = ticket.messages.filter((m) => staffView || !m.internal);
  return (
    <div className="stack">
      <ol className="conversation" aria-label="Messages">
        {msgs.map((m) => { const a = userById(db, m.authorId); const staff = a?.role === 'admin'; return (
          <li key={m.id} className={cx('msg', m.authorId === viewerId && 'mine', m.internal && 'internal')}>
            <Avatar initials={a?.initials || '?'} size="sm" tone={staff ? 'accent' : undefined} />
            <div className="msg-bubble">
              <p className="row small" style={{ gap: 8 }}><span className="strong">{a?.name}</span>{staff && <Badge tone="accent">LearnUX support</Badge>}{m.internal && <Badge tone="warning" icon={<LuLock aria-hidden="true" />}>Internal note — not visible to learner</Badge>}<span className="xs muted">{formatDateTime(m.at)}</span></p>
              <p style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{m.body}</p>
            </div>
          </li>
        ); })}
      </ol>
      <form className="card stack-sm" onSubmit={(e) => { e.preventDefault(); if (!body.trim()) { setErr(internal ? 'Write the internal note before saving' : 'Write a message before sending'); return; } onSend(body.trim(), internal); setBody(''); setErr(''); setInternal(false); }}>
        <Textarea label={staffView ? (internal ? 'Internal note' : 'Reply to learner') : 'Your reply'} value={body} onChange={(e) => setBody(e.target.value)} error={err} rows={4} hint={staffView && internal ? 'Only staff can see internal notes.' : undefined} />
        <div className="row-between">
          {staffView ? <Checkbox label="Internal note (staff only)" checked={internal} onChange={(e) => setInternal(e.target.checked)} /> : <span className="small muted">{ticket.status === 'resolved' ? 'Replying will reopen this request.' : 'We usually reply within 1 working day.'}</span>}
          <Button type="submit" icon={<LuSend aria-hidden="true" />}>{internal ? 'Save note' : 'Send'}</Button>
        </div>
      </form>
    </div>
  );
}
