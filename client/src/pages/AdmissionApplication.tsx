import { useMemo, useState, type DragEvent, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, FileText, FileUp, Loader2, Send, Trash2, UploadCloud } from 'lucide-react';
import { api } from '../services/api';
import { fileToDataUrl } from '../utils/fileToDataUrl';
import type { LandingContent } from '../types';

interface AdmissionApplicationProps {
  content: LandingContent;
}

const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'MALE',
  desiredClass: '',
  desiredStream: '',
  previousSchool: '',
  previousClass: '',
  parentName: '',
  parentPhone: '',
  parentEmail: '',
  phone: '',
  email: '',
  address: '',
  birthCertificate: '',
  reportCard: ''
};

const maxFileSize = 5 * 1024 * 1024;

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdmissionApplication({ content }: AdmissionApplicationProps) {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [documents, setDocuments] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const documentNames = useMemo(() => new Set(documents.map((file) => `${file.name}-${file.size}`)), [documents]);

  const addDocuments = (files: File[]) => {
    const accepted = files.filter((file) => {
      const key = `${file.name}-${file.size}`;
      if (documentNames.has(key)) return false;
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is larger than 5 MB.`);
        return false;
      }
      return true;
    });

    if (accepted.length) {
      setDocuments((current) => [...current, ...accepted].slice(0, 10));
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    addDocuments(Array.from(event.dataTransfer.files || []));
  };

  const submitApplication = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const encodedDocuments = await Promise.all(documents.map(fileToDataUrl));

      await api.post('/admissions/submit', {
        ...form,
        email: form.email || form.parentEmail,
        phone: form.phone || form.parentPhone,
        academicYear: new Date().getFullYear(),
        term: 1,
        documents: [
          ...encodedDocuments,
          form.birthCertificate.trim(),
          form.reportCard.trim()
        ].filter(Boolean)
      }, {
        successMessage: 'Application submitted for admin review.'
      });

      toast.success('Application sent. Admin will verify documents, approve enrollment, and parent sign-in will be enabled.');
      setForm(emptyForm);
      setDocuments([]);
      navigate('/admissions', { replace: true });
    } catch (error: any) {
      toast.error(error?.appError?.message || error?.response?.data?.message || error?.message || 'Unable to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="admission-application-screen">
      <section className="admission-application-shell">
        <div className="admission-application-hero">
          <Link to="/admissions" className="admission-back-link">
            <ArrowLeft size={17} /> Admissions
          </Link>
          <p className="eyebrow">{content.sections.admissions.eyebrow}</p>
          <h1>{content.admissions.primaryAction || 'Start Application'}</h1>
          <p>{content.admissions.text}</p>
          <div className="admission-review-steps">
            <span><CheckCircle2 size={16} /> Parent submits details</span>
            <span><FileText size={16} /> Admin verifies documents</span>
            <span><FileUp size={16} /> Approval enrolls student</span>
          </div>
        </div>

        <form className="admission-application-form" data-no-draft onSubmit={submitApplication}>
          <div className="admission-form-section">
            <div>
              <h2>Student Details</h2>
              <p>Use the child details exactly as they appear on official documents.</p>
            </div>
            <div className="admissions-form-grid">
              <label>First name<input required value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} /></label>
              <label>Middle name<input value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} /></label>
              <label>Last name<input required value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} /></label>
              <label>Date of birth<input required type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} /></label>
              <label>Gender<select required value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></label>
              <label>Desired class<input required value={form.desiredClass} onChange={(event) => setForm({ ...form, desiredClass: event.target.value })} /></label>
              <label>Desired stream<input value={form.desiredStream} onChange={(event) => setForm({ ...form, desiredStream: event.target.value })} /></label>
              <label>Previous school<input value={form.previousSchool} onChange={(event) => setForm({ ...form, previousSchool: event.target.value })} /></label>
              <label>Previous class<input value={form.previousClass} onChange={(event) => setForm({ ...form, previousClass: event.target.value })} /></label>
            </div>
          </div>

          <div className="admission-form-section">
            <div>
              <h2>Parent Details</h2>
              <p>Admin uses this contact to verify the application and activate parent access after approval.</p>
            </div>
            <div className="admissions-form-grid">
              <label>Parent full name<input required value={form.parentName} onChange={(event) => setForm({ ...form, parentName: event.target.value })} /></label>
              <label>Parent phone<input required value={form.parentPhone} onChange={(event) => setForm({ ...form, parentPhone: event.target.value, phone: event.target.value })} /></label>
              <label>Parent email<input required type="email" value={form.parentEmail} onChange={(event) => setForm({ ...form, parentEmail: event.target.value, email: event.target.value })} /></label>
              <label className="admission-wide-field">Home address<input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
            </div>
          </div>

          <div className="admission-form-section">
            <div>
              <h2>Documents</h2>
              <p>Attach birth certificate, report card, transfer letter, ID copy, or any requested supporting file.</p>
            </div>
            <div className="admissions-form-grid">
              <label>Birth certificate link<input placeholder="Optional URL or reference" value={form.birthCertificate} onChange={(event) => setForm({ ...form, birthCertificate: event.target.value })} /></label>
              <label>Last report card link<input placeholder="Optional URL or reference" value={form.reportCard} onChange={(event) => setForm({ ...form, reportCard: event.target.value })} /></label>
              <label
                className={`admission-dropzone ${dragActive ? 'is-active' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                <UploadCloud size={28} />
                <strong>Drop documents here or click to attach</strong>
                <small>PDF, image, or Word files. Max 5 MB each.</small>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  onChange={(event) => addDocuments(Array.from(event.target.files || []))}
                />
              </label>
            </div>
            {documents.length > 0 && (
              <div className="admission-doc-list">
                {documents.map((file) => (
                  <span key={`${file.name}-${file.size}`}>
                    <FileText size={14} /> {file.name} <small>{formatBytes(file.size)}</small>
                    <button type="button" onClick={() => setDocuments((current) => current.filter((item) => item !== file))} aria-label={`Remove ${file.name}`}>
                      <Trash2 size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="admission-submit-row">
            <button type="submit" className="admission-submit-btn" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="spin" /> : <Send size={18} />} Submit for Admin Review
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
