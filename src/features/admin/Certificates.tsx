import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuAward } from 'react-icons/lu';
import { useSession } from '../../hooks/useSession';
import { useTitle } from '../../hooks/useTitle';
import { api } from '../../data/services';
import { courseById, userById } from '../../data/selectors';
import { PageHeader } from '../../components/layout/layouts';
import { Breadcrumbs } from '../../components/ui/navigation';
import { Alert, EmptyState, StatusBadge, useToast } from '../../components/ui/feedback';
import { Card, DataTable, KeyValue } from '../../components/ui/data';
import { Button } from '../../components/ui/Button';
import { SearchInput, Select, TextField } from '../../components/ui/form';
import { ConfirmDialog, Dialog } from '../../components/ui/overlay';
import { CertificateDoc } from '../../components/learning/patterns';
import { formatDate, formatDateTime } from '../../utils/format';
import { NotFound } from '../public/System';

export function CertificateManagement() {
  const { db } = useSession(); useTitle('Certificates');
  const [q, setQ] = useState(''); const [st, setSt] = useState('all');
  const rows = db.certificates.filter((c) => (st === 'all' || c.status === st) && (!q || (c.id + c.nameOnCertificate).toLowerCase().includes(q.toLowerCase())));
  const requests = db.tickets.filter((t) => t.category === 'Certificate' && t.status !== 'resolved');
  return (
    <>
      <PageHeader title="Certificate management" lead={`${db.certificates.length} certificates issued.`} />
      {requests.length > 0 && <Alert tone="info" title={`${requests.length} open certificate request${requests.length > 1 ? 's' : ''}`} className="subnav">{requests.map((t) => <span key={t.id} style={{ display: 'block' }}><Link to={`/admin/support/${t.id}`}>{t.id}: {t.subject}</Link></span>)}</Alert>}
      <div className="row" style={{ marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
        <SearchInput label="Search certificates" value={q} onChange={setQ} placeholder="Reference or holder" className="grow" />
        <Select label="Status" value={st} onChange={(e) => setSt(e.target.value)} options={[{ value: 'all', label: 'Any status' }, { value: 'valid', label: 'Valid' }, { value: 'revoked', label: 'Revoked' }]} />
      </div>
      <DataTable caption="Certificates" rows={rows} rowKey={(c) => c.id} empty={<EmptyState icon={<LuAward />} title="No certificates match" />} columns={[
        { key: 'r', header: 'Reference', primary: true, render: (c) => <Link to={`/admin/certificates/${c.id}`} className="mono strong">{c.id}</Link> },
        { key: 'h', header: 'Holder', render: (c) => c.nameOnCertificate },
        { key: 'c', header: 'Course', render: (c) => courseById(db, c.courseId)!.title },
        { key: 'i', header: 'Issued', render: (c) => formatDate(c.issuedAt) },
        { key: 's', header: 'Status', render: (c) => <StatusBadge tone={c.status === 'valid' ? 'success' : 'error'}>{c.status === 'valid' ? 'Valid' : 'Revoked'}</StatusBadge> },
      ]} />
    </>
  );
}

export function CertificateRecord() {
  const { certId } = useParams(); const { db } = useSession(); const toast = useToast();
  const cert = db.certificates.find((c) => c.id === certId); useTitle(cert ? cert.id : 'Certificate');
  const [revoke, setRevoke] = useState(false); const [reason, setReason] = useState('Issued in error'); const [reinstate, setReinstate] = useState(false); const [rename, setRename] = useState(false); const [name, setName] = useState(''); const [err, setErr] = useState('');
  if (!cert) return <NotFound />;
  const c = courseById(db, cert.courseId)!; const holder = userById(db, cert.userId)!; const log = db.audit.filter((a) => a.target === cert.id);
  return (
    <>
      <PageHeader crumbs={<Breadcrumbs items={[['Certificates', '/admin/certificates'], [cert.id]]} />} title={<span className="mono">{cert.id}</span>} lead={`${cert.nameOnCertificate} · ${c.title}`} actions={<StatusBadge tone={cert.status === 'valid' ? 'success' : 'error'}>{cert.status === 'valid' ? 'Valid' : 'Revoked'}</StatusBadge>} />
      <div className="with-aside">
        <div className="stack"><CertificateDoc cert={cert} course={c} instructor={userById(db, c.instructorId)} /><Card title="History">{log.length ? <ul className="stack-sm" style={{ paddingLeft: 18 }}>{log.map((a) => <li key={a.id} className="small">{formatDateTime(a.at)} — {a.action}: {a.detail}</li>)}</ul> : <p className="small secondary">Issued {formatDate(cert.issuedAt)}. No changes since.</p>}</Card></div>
        <aside className="stack">
          <Card title="Record" headingLevel={2}><KeyValue items={[['Holder account', <Link to={`/admin/users/${holder.id}`}>{holder.name}</Link>], ['Version', String(cert.version)], ['Issued', formatDate(cert.issuedAt)], ...(cert.status === 'revoked' ? [['Revoked', `${formatDate(cert.revokedAt)} — ${cert.revokedReason}`] as [string, string]] : [])]} /></Card>
          <Card title="Actions" headingLevel={2}><div className="stack-sm">
            <Button variant="secondary" block to={`/verify/${cert.id}`}>View public verification</Button>
            <Button variant="secondary" block onClick={() => { setName(cert.nameOnCertificate); setErr(''); setRename(true); }}>Correct holder name</Button>
            {cert.status === 'valid' ? <Button variant="danger" block onClick={() => setRevoke(true)}>Revoke certificate</Button> : <Button block onClick={() => setReinstate(true)}>Reinstate certificate</Button>}
          </div></Card>
        </aside>
      </div>
      <ConfirmDialog open={revoke} onClose={() => setRevoke(false)} destructive title="Revoke this certificate?" confirmLabel="Revoke certificate" simulated onConfirm={() => { api.revokeCertificate(cert.id, reason); toast('Revoked — public verification now shows “Revoked”'); }}>
        <p>Public verification of {cert.id} will show it as revoked immediately and {holder.name} will be notified.</p>
        <Select label="Public reason" value={reason} onChange={(e) => setReason(e.target.value)} options={['Issued in error', 'Requirements not met', 'Academic misconduct']} hint="Shown on the public verification page." />
      </ConfirmDialog>
      <ConfirmDialog open={reinstate} onClose={() => setReinstate(false)} title="Reinstate this certificate?" confirmLabel="Reinstate" simulated onConfirm={() => { api.reinstateCertificate(cert.id); toast('Reinstated — verification shows “Valid”'); }}><p>Public verification will show it as valid again.</p></ConfirmDialog>
      <Dialog open={rename} onClose={() => setRename(false)} title="Correct holder name" footer={<><Button variant="secondary" onClick={() => setRename(false)}>Cancel</Button><Button onClick={() => { if (name.trim().length < 3) { setErr('Enter the corrected name'); return; } api.correctCertificateName(cert.id, name.trim()); setRename(false); toast(`Reissued as version ${cert.version + 1} with the same reference`); }}>Reissue with new name</Button></>}>
        <div className="stack"><TextField label="Name on certificate" value={name} onChange={(e) => setName(e.target.value)} error={err} /><p className="small secondary">The certificate is reissued with the same reference and a new version number. Verification notes the reissue.</p></div>
      </Dialog>
    </>
  );
}
