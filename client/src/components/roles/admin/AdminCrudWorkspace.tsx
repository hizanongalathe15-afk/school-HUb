import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  CheckSquare,
  Download,
  Edit3,
  FileText,
  Image,
  Landmark,
  PlayCircle,
  Plus,
  Save,
  Search,
  Settings,
  Square,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { adminWorkspaceService, type AdminWorkspaceRecord } from '../../../services/adminService';
import { findAdminRoute } from './adminMenu';
import { useConfirmationDialog } from '../../../hooks/useConfirmationDialog';
import ConfirmDialog from '../../ui/ConfirmDialog';

const emptyRecord: Omit<AdminWorkspaceRecord, 'id' | 'updatedAt'> = {
  name: '',
  category: '',
  owner: '',
  status: 'Active',
  notes: '',
  amount: undefined,
  dueDate: '',
  priority: 'Normal',
  files: [],
};

type WorkspaceVariant = 'media' | 'finance' | 'schedule' | 'settings' | 'reports' | 'people' | 'developer' | 'general';

export default function AdminCrudWorkspace() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const route = findAdminRoute(location.pathname);
  const variant = getWorkspaceVariant(route?.section, route?.title, route?.parentTitle, location.pathname);
  const [records, setRecords] = useState<AdminWorkspaceRecord[]>([]);
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRecord);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const confirmation = useConfirmationDialog();

useEffect(() => {
     const fetchRecords = async () => {
       setLoading(true);
       try {
         const data = await adminWorkspaceService.list(location.pathname);
         setRecords(data);
       } catch {
         toast.error(t('adminWorkspace.loadingRecords'));
         setRecords([]);
       } finally {
         setLoading(false);
       }
     };

     fetchRecords();
   }, [location.pathname, t]);

  const filteredRecords = useMemo(() => {
    const nextQuery = query.trim().toLowerCase();
    if (!nextQuery) return records;
    return records.filter((record) =>
      [record.name, record.category, record.owner, record.status, record.notes]
        .join(' ')
        .toLowerCase()
        .includes(nextQuery),
    );
  }, [query, records]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyRecord);
    setEditorOpen(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyRecord,
      category: route?.parentTitle || route?.section || '',
      owner: 'Admin Principal',
    });
    setEditorOpen(true);
  };

  const saveRecord = async () => {
    if (!form.name.trim()) {
      toast.error(t('adminWorkspace.nameLabel') + ' ' + t('status.attention'));
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim() || route?.parentTitle || route?.section || t('ariaLabels.categoryPlaceholder'),
      owner: form.owner.trim() || 'Admin Principal',
      notes: form.notes.trim(),
      amount: form.amount ? Number(form.amount) : undefined,
      files: form.files ?? [],
    };

    try {
      if (editingId) {
        const updated = await adminWorkspaceService.update(location.pathname, editingId, payload);
        setRecords(records.map((record) => (record.id === editingId ? updated : record)));
      } else {
        const created = await adminWorkspaceService.create(location.pathname, payload);
        setRecords([created, ...records]);
      }
      resetForm();
    } catch {
      toast.error(t('adminWorkspace.createRecord'));
    }
  };

  const editRecord = (record: AdminWorkspaceRecord) => {
    setEditingId(record.id);
    setForm({
      name: record.name,
      category: record.category,
      owner: record.owner,
      status: record.status,
      notes: record.notes,
      amount: record.amount,
      dueDate: record.dueDate || '',
      priority: record.priority || 'Normal',
      files: record.files || [],
    });
    setEditorOpen(true);
  };

  const duplicateRecord = async (record: AdminWorkspaceRecord) => {
    try {
      const duplicate = await adminWorkspaceService.create(location.pathname, {
        name: `${record.name} ${t('buttons.duplicate')}`,
        category: record.category,
        owner: record.owner,
        status: record.status,
        notes: record.notes,
        amount: record.amount,
        dueDate: record.dueDate,
        priority: record.priority,
        files: record.files || [],
      });
      setRecords([duplicate, ...records]);
    } catch {
      toast.error(t('adminWorkspace.createRecord'));
    }
  };

  const deleteRecord = async (recordId: string) => {
    const confirmed = await confirmation.confirm({
      title: t('adminWorkspace.deleteConfirm'),
      message: t('adminWorkspace.deleteMessage'),
      confirmText: t('adminWorkspace.deleteConfirmText'),
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await adminWorkspaceService.delete(location.pathname, recordId);
      setRecords(records.filter((record) => record.id !== recordId));
      setSelectedIds((current) => current.filter((id) => id !== recordId));
      if (editingId === recordId) resetForm();
    } catch {
      toast.error(t('adminWorkspace.deleteConfirm'));
    }
  };

  const exportCsv = () => {
    const exportRecords = selectedIds.length
      ? filteredRecords.filter((record) => selectedIds.includes(record.id))
      : filteredRecords;
    const rows = [
      ['Name', 'Category', 'Owner', 'Status', 'Amount', 'Due Date', 'Priority', 'Files', 'Notes', 'Updated At'],
      ...exportRecords.map((record) => [
        record.name,
        record.category,
        record.owner,
        record.status,
        record.amount ?? '',
        record.dueDate ?? '',
        record.priority ?? '',
        record.files?.length ?? 0,
        record.notes,
        record.updatedAt,
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(route?.title ?? 'admin-workspace').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const attachFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (!files.length) return;
    const encoded = await Promise.all(files.map(fileToWorkspaceAsset));
    setForm((current) => ({ ...current, files: [...(current.files || []), ...encoded] }));
    toast.success(`${files.length} file(s) ready`);
  };

  const removeFile = (url: string) => {
    setForm((current) => ({ ...current, files: (current.files || []).filter((file) => file.url !== url) }));
  };

  const toggleSelected = (recordId: string) => {
    setSelectedIds((current) => current.includes(recordId) ? current.filter((id) => id !== recordId) : [...current, recordId]);
  };

  const toggleAll = () => {
    const visibleIds = filteredRecords.map((record) => record.id);
    setSelectedIds((current) => visibleIds.every((id) => current.includes(id)) ? [] : visibleIds);
  };

  const bulkDelete = async () => {
    if (!selectedIds.length) return;
    const confirmed = await confirmation.confirm({
      title: t('adminWorkspace.bulkDeleteConfirm'),
      message: t('adminWorkspace.bulkDeleteMessage', { count: selectedIds.length }),
      confirmText: t('buttons.delete'),
      type: 'danger'
    });
    if (!confirmed) return;
    try {
      await Promise.all(selectedIds.map((id) => adminWorkspaceService.delete(location.pathname, id)));
      setRecords((current) => current.filter((record) => !selectedIds.includes(record.id)));
      setSelectedIds([]);
      toast.success(t('adminWorkspace.bulkDeleteMessage', { count: selectedIds.length, defaultValue: 'Selected records deleted' }));
    } catch {
      toast.error(t('adminWorkspace.bulkDeleteConfirm'));
    }
  };

  return (
    <div className={`admin-crud-workspace admin-crud-workspace--${variant}`}>
      <section className="admin-crud-hero">
        <div>
          <span className="admin-page-kicker">{route?.section ?? 'Admin Principal'}</span>
          <h2>{route?.title ?? 'Admin Workspace'}</h2>
          <p>
            {workspaceCopyStatic[variant]}
          </p>
        </div>
<div className="admin-crud-hero-metrics">
           <div className="admin-crud-summary">
<strong>{records.length}</strong>
               <span>{t('adminWorkspace.totalRecords')}</span>
           </div>
           <div className="admin-crud-summary admin-crud-summary--accent">
             <strong>{records.filter((record) => record.status === 'Active').length}</strong>
             <span>{t('status.active')}</span>
           </div>
         </div>
      </section>

      <WorkspaceFeatureBand
        variant={variant}
        records={records}
      />

      <section className="admin-crud-grid">
        <div className="admin-crud-panel">
          <div className="admin-crud-toolbar">
<label className="admin-crud-search">
               <Search size={17} />
               <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('adminWorkspace.searchPlaceholder')} />
             </label>
<div className="admin-crud-toolbar-actions">
               {selectedIds.length > 0 && (
                 <>
                   <button className="btn btn-danger" type="button" onClick={bulkDelete}>
                     <Trash2 size={16} /> {t('buttons.delete')} {selectedIds.length}
                   </button>
                   <button className="btn btn-secondary" type="button" onClick={exportCsv}>
                     <Download size={16} /> {t('buttons.exportSelected')}
                   </button>
                 </>
               )}
               <button className="btn btn-secondary" type="button" onClick={exportCsv}>
                 <Download size={16} /> {t('buttons.export')}
               </button>
               <button className="btn btn-primary" type="button" onClick={openCreate}>
                 <Plus size={16} /> {t('buttons.add')}
               </button>
             </div>
          </div>

          <div className="admin-crud-table-wrap">
            <table className="admin-crud-table">
<thead>
                 <tr>
                   <th>
                     <button type="button" className="admin-crud-check" onClick={toggleAll} aria-label={t('adminWorkspace.selectAll')}>
                       {filteredRecords.length > 0 && filteredRecords.every((record) => selectedIds.includes(record.id)) ? <CheckSquare size={17} /> : <Square size={17} />}
                     </button>
                   </th>
                   <th>{t('adminWorkspace.nameLabel')}</th>
                   <th>{t('adminWorkspace.categoryLabel')}</th>
                   <th>{t('adminWorkspace.ownerLabel')}</th>
                   {variant === 'finance' && <th>{t('adminWorkspace.amountLabel')}</th>}
                   {variant === 'schedule' && <th>{t('adminWorkspace.dateLabel')}</th>}
                   <th>{t('adminWorkspace.statusLabel')}</th>
                   <th>{t('adminWorkspace.filesLabel')}</th>
                   <th>{t('adminWorkspace.updatedLabel')}</th>
                   <th>{t('adminWorkspace.actionsLabel')}</th>
                 </tr>
               </thead>
<tbody>
                 {loading && (
                   <tr>
                     <td colSpan={variant === 'finance' || variant === 'schedule' ? 9 : 8}>{t('adminWorkspace.loadingRecords')}</td>
                   </tr>
                 )}
                 {filteredRecords.map((record) => (
                   <tr key={record.id} className={selectedIds.includes(record.id) ? 'is-selected' : ''}>
                     <td>
                       <button type="button" className="admin-crud-check" onClick={() => toggleSelected(record.id)} aria-label={`${t('buttons.edit')} ${record.name}`}>
                         {selectedIds.includes(record.id) ? <CheckSquare size={17} /> : <Square size={17} />}
                       </button>
                     </td>
                     <td>
                       <strong>{record.name}</strong>
                       <small>{record.notes || t('adminNotesPlaceholder')}</small>
                     </td>
                     <td>{record.category}</td>
                     <td>{record.owner}</td>
                     {variant === 'finance' && <td>{record.amount ? `KES ${record.amount.toLocaleString()}` : '-'}</td>}
                     {variant === 'schedule' && <td>{record.dueDate || '-'}</td>}
                     <td><span className={`admin-crud-status admin-crud-status--${record.status.toLowerCase()}`}>{t(`status.${record.status.toLowerCase()}` as any) || record.status}</span></td>
                     <td>{record.files?.length || 0}</td>
                     <td>{new Date(record.updatedAt).toLocaleDateString()}</td>
                     <td>
                       <div className="admin-crud-actions">
                         <button type="button" onClick={() => editRecord(record)} aria-label={t('ariaLabels.editMedia')}><Edit3 size={15} /></button>
                         <button type="button" onClick={() => duplicateRecord(record)} aria-label={t('buttons.duplicate')}><Plus size={15} /></button>
                         <button type="button" onClick={() => deleteRecord(record.id)} aria-label={t('buttons.delete')}><Trash2 size={15} /></button>
                       </div>
                     </td>
                   </tr>
                 ))}
                 {!loading && filteredRecords.length === 0 && (
                   <tr>
                     <td colSpan={variant === 'finance' || variant === 'schedule' ? 9 : 8}>{t('adminWorkspace.noRecords')}</td>
                   </tr>
                 )}
               </tbody>
            </table>
          </div>
        </div>

      </section>

      {(variant === 'media' || variant === 'schedule') && records.some((record) => record.files?.length) && (
        <section className="admin-crud-gallery">
          {records.flatMap((record) => (record.files || []).map((file) => ({ ...file, recordName: record.name }))).map((file) => (
            <article key={`${file.recordName}-${file.url}`}>
              {file.type.startsWith('image/') ? (
                <img src={file.url} alt={file.name} />
              ) : file.type.startsWith('video/') ? (
                <Video size={30} />
              ) : (
                <FileText size={30} />
              )}
              <strong>{file.recordName}</strong>
              <span>{file.name}</span>
            </article>
          ))}
        </section>
      )}

{editorOpen && (
         <div className="admin-crud-modal-backdrop" role="presentation">
           <form className="admin-crud-editor admin-crud-editor--modal" onSubmit={(event) => { event.preventDefault(); saveRecord(); }}>
             <div className="admin-crud-editor-head">
               <div>
                 <span className="admin-page-kicker">{route?.title || 'Admin Workspace'}</span>
                 <h3>{editingId ? t('adminWorkspace.editRecord') : t('adminWorkspace.addRecord')}</h3>
               </div>
               <button type="button" onClick={resetForm} aria-label={t('adminWorkspace.closeEditor')}>
                 <X size={16} />
               </button>
             </div>
             <div className="admin-crud-editor-grid">
               <label>
                 {t('adminWorkspace.nameLabel')}
                 <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={`${route?.title ?? t('placeholders.name')} name`} />
               </label>
               <label>
                 {t('adminWorkspace.categoryLabel')}
                 <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder={route?.parentTitle ?? route?.section ?? t('placeholders.category')} />
               </label>
               <label>
                 {t('adminWorkspace.ownerLabel')}
                 <input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} placeholder={t('adminWorkspace.ownerPlaceholder')} />
               </label>
               {variant === 'finance' && (
                 <label>
                   {t('adminWorkspace.amountLabel')}
                   <input type="number" value={form.amount ?? ''} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) || undefined })} placeholder={t('placeholders.amount')} />
                 </label>
               )}
               {(variant === 'schedule' || variant === 'finance') && (
                 <label>
                   {t('adminWorkspace.dateLabel')}
                   <input type="date" value={form.dueDate || ''} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
                 </label>
               )}
               <label>
                 {t('labels.priority', { defaultValue: 'Priority' })}
                 <select value={form.priority || 'Normal'} onChange={(event) => setForm({ ...form, priority: event.target.value as AdminWorkspaceRecord['priority'] })}>
                   <option>{t('labels.priorityLow', { defaultValue: t('priority.low') })}</option>
                   <option>{t('labels.priorityNormal', { defaultValue: t('priority.normal') })}</option>
                   <option>{t('labels.priorityHigh', { defaultValue: t('priority.high') })}</option>
                   <option>{t('labels.priorityCritical', { defaultValue: t('priority.critical') })}</option>
                 </select>
               </label>
               <label>
                 {t('adminWorkspace.statusLabel')}
                 <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AdminWorkspaceRecord['status'] })}>
                   <option>{t('status.active')}</option>
                   <option>{t('status.draft')}</option>
                   <option>{t('status.archived')}</option>
                 </select>
               </label>
             </div>
             <label>
               {t('adminWorkspace.notesLabel', { defaultValue: 'Notes' })}
               <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder={t('adminWorkspace.notesPlaceholder')} />
             </label>
             <label
               className="admin-crud-dropzone"
               onDragOver={(event) => event.preventDefault()}
               onDrop={(event) => {
                 event.preventDefault();
                 void attachFiles(event.dataTransfer.files);
               }}
             >
               <Upload size={20} />
               <span>{variant === 'media' || variant === 'schedule' ? t('adminMediaDropzone', { defaultValue: 'Drop images, videos, PDFs, documents, or media assets' }) : t('adminMediaDropzone', { defaultValue: 'Drop supporting documents or images' })}</span>
               <input type="file" multiple onChange={(event) => event.target.files && void attachFiles(event.target.files)} />
             </label>
{!!form.files?.length && (
                <div className="admin-crud-file-grid">
                  {form.files.map((file) => (
                    <div key={file.url} className="admin-crud-file">
                      {file.type.startsWith('image/') ? (
                        <img src={file.url} alt={file.name} />
                      ) : file.type.startsWith('video/') ? (
                        <Video size={24} />
                      ) : (
                        <FileText size={24} />
                      )}
                      <span>{file.name}</span>
                      <button type="button" onClick={() => removeFile(file.url)} aria-label={t('buttons.delete')}><X size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
             <div className="admin-crud-modal-actions">
               <button className="btn btn-secondary" type="button" onClick={resetForm}>{t('buttons.cancel')}</button>
               <button className="btn btn-primary" type="submit">
                 <Save size={16} /> {editingId ? t('buttons.save') : t('buttons.create')}
               </button>
</div>
        </form>
      </div>
    )}
    <ConfirmDialog
        open={confirmation.isOpen}
        title={confirmation.options?.title || ''}
        message={confirmation.options?.message || ''}
        confirmLabel={confirmation.options?.confirmText}
        cancelLabel={confirmation.options?.cancelText}
        type={confirmation.options?.type}
        icon={confirmation.options?.icon}
        onConfirm={confirmation.handleConfirm}
        onCancel={confirmation.handleCancel}
        loading={confirmation.isLoading}
      />
    </div>
  );
}

const workspaceCopyStatic: Record<WorkspaceVariant, string> = {
  media: 'Media-ready control panel with drag-and-drop uploads, previews, album records, ownership, publishing status, and export.',
  finance: 'Finance workspace for payments, arrears, budgets, approvals, evidence files, amounts, due dates, and audit-ready exports.',
  schedule: 'Scheduling workspace for calendars, timetables, events, exams, leave plans, due dates, attached notices, and status tracking.',
  settings: 'Configuration workspace for policies, integrations, templates, backup notes, security settings, and operational documents.',
  reports: 'Reports workspace for saved report definitions, attachments, export queues, approvals, and evidence-backed records.',
  people: 'People-management workspace for assignments, documents, links, approvals, permissions, and user lifecycle records.',
  developer: 'Developer operations workspace for test runs, maintenance actions, API keys, database notes, logs, and technical audit records.',
  general: 'Complete admin control panel with create, update, duplicate, delete, search, attachments, status tracking, and export actions.',
};

function getWorkspaceVariant(section = '', title = '', parentTitle = '', path = ''): WorkspaceVariant {
  const haystack = `${section} ${title} ${parentTitle} ${path}`.toLowerCase();
  if (haystack.includes('media') || haystack.includes('gallery') || haystack.includes('virtual-tour') || haystack.includes('video')) return 'media';
  if (haystack.includes('finance') || haystack.includes('fee') || haystack.includes('salary') || haystack.includes('mpesa') || haystack.includes('budget') || haystack.includes('arrears') || haystack.includes('expense') || haystack.includes('bursar') || haystack.includes('scholarship')) return 'finance';
  if (haystack.includes('calendar') || haystack.includes('timetable') || haystack.includes('attendance') || haystack.includes('event') || haystack.includes('trip') || haystack.includes('exam') || haystack.includes('leave')) return 'schedule';
  if (haystack.includes('setting') || haystack.includes('backup') || haystack.includes('language') || haystack.includes('security') || haystack.includes('integration') || haystack.includes('password') || haystack.includes('2fa')) return 'settings';
  if (haystack.includes('report') || haystack.includes('analytics') || haystack.includes('kcse') || haystack.includes('audit')) return 'reports';
  if (haystack.includes('developer') || haystack.includes('database') || haystack.includes('maintenance') || haystack.includes('api-key') || haystack.includes('error-log') || haystack.includes('performance')) return 'developer';
  if (haystack.includes('student') || haystack.includes('parent') || haystack.includes('teacher') || haystack.includes('staff') || haystack.includes('user') || haystack.includes('role')) return 'people';
  return 'general';
}

function WorkspaceFeatureBand({
  variant,
  records,
}: {
  variant: WorkspaceVariant;
  records: AdminWorkspaceRecord[];
}) {
  const active = records.filter((record) => record.status === 'Active').length;
  const fileCount = records.reduce((sum, record) => sum + (record.files?.length || 0), 0);
  const moneyTotal = records.reduce((sum, record) => sum + (record.amount || 0), 0);
  const cards = getFeatureCards(variant, active, fileCount, moneyTotal);

  return (
    <section className="admin-crud-feature-band">
      <div className="admin-crud-feature-cards">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label}>
              <Icon size={20} />
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getFeatureCards(variant: WorkspaceVariant, active: number, fileCount: number, moneyTotal: number) {
  const defaults = [
    { label: 'Active', value: String(active), icon: PlayCircle },
    { label: 'Files', value: String(fileCount), icon: FileText },
    { label: 'Exportable', value: 'CSV', icon: Download },
  ];

  if (variant === 'media') return [
    { label: 'Published Assets', value: String(active), icon: Image },
    { label: 'Uploads', value: String(fileCount), icon: Upload },
    { label: 'Tour Ready', value: '360', icon: PlayCircle },
  ];
  if (variant === 'finance') return [
    { label: 'Active Items', value: String(active), icon: Landmark },
    { label: 'Tracked Amount', value: `KES ${moneyTotal.toLocaleString()}`, icon: Landmark },
    { label: 'Receipts', value: String(fileCount), icon: FileText },
  ];
  if (variant === 'schedule') return [
    { label: 'Scheduled', value: String(active), icon: CalendarDays },
    { label: 'Notices', value: String(fileCount), icon: FileText },
    { label: 'Exportable', value: 'ICS/CSV', icon: Download },
  ];
  if (variant === 'settings') return [
    { label: 'Policies', value: String(active), icon: Settings },
    { label: 'Documents', value: String(fileCount), icon: FileText },
    { label: 'Audit', value: 'On', icon: PlayCircle },
  ];
  if (variant === 'developer') return [
    { label: 'Actions', value: String(active), icon: Settings },
    { label: 'Logs', value: String(fileCount), icon: FileText },
    { label: 'Runbooks', value: 'Ready', icon: PlayCircle },
  ];
  return defaults;
}

function fileToWorkspaceAsset(file: File): Promise<{ name: string; type: string; url: string }> {
  return new Promise((resolve, reject) => {
    if (file.size > 2_500_000) {
      reject(new Error(`${file.name} is too large. Use files under 2.5 MB.`));
      toast.error(`${file.name} is too large. Use files under 2.5 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || 'file', url: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
