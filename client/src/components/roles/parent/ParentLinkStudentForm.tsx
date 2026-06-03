import { FormEvent, useState, useCallback } from 'react';
import { 
  CheckCircle2, 
  Link2, 
  Loader2, 
  UserPlus, 
  Calendar, 
  Hash,
  Users,
  AlertCircle,
  X,
  Shield,
  Mail
} from 'lucide-react';
import parentService from '../../../services/parentService';
import { getErrorMessage } from '../../../utils/feedback';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { clsx } from 'clsx';

interface ParentLinkStudentFormProps {
  onLinked: () => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  admissionNumber: string;
  dateOfBirth: string;
  relationship: string;
  studentEmail?: string;
}

const RELATIONSHIP_OPTIONS = [
  'Father',
  'Mother',
  'Guardian',
  'Grandparent',
  'Uncle',
  'Aunt',
  'Brother',
  'Sister',
  'Other'
];

export default function ParentLinkStudentForm({ 
  onLinked, 
  onCancel,
  className 
}: ParentLinkStudentFormProps) {
  const [form, setForm] = useState<FormData>({
    admissionNumber: '',
    dateOfBirth: '',
    relationship: 'Guardian',
    studentEmail: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateForm = useCallback(() => {
    const errors: string[] = [];
    
    if (!form.admissionNumber.trim()) {
      errors.push('Admission number is required');
    } else if (form.admissionNumber.length < 5) {
      errors.push('Admission number seems too short');
    }
    
    if (!form.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const age = new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear();
      if (age < 3 || age > 20) {
        errors.push('Date of birth seems unusual');
      }
    }
    
    if (!form.relationship.trim()) {
      errors.push('Relationship is required');
    }
    
    if (form.studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.studentEmail)) {
      errors.push('Please enter a valid email address');
    }
    
    return errors;
  }, [form]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }
    
    setSubmitting(true);
    setMessage('');
    setError('');

    try {
      const response = await parentService.children.linkExistingStudent({
        admissionNumber: form.admissionNumber.trim(),
        dateOfBirth: form.dateOfBirth,
        relationship: form.relationship.trim(),
        studentEmail: form.studentEmail?.trim() || undefined
      });
      
      if (response.success) {
        setMessage(response.message || 'Student linked successfully! You can now view their progress.');
        setForm({ 
          admissionNumber: '', 
          dateOfBirth: '', 
          relationship: 'Guardian',
          studentEmail: ''
        });
        setTouched({});
        
        // Call onLinked after short delay to show success message
        setTimeout(() => {
          onLinked();
        }, 2000);
      } else {
        setError(response.message || 'Unable to link student. Please check the details and try again.');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Unable to link student. Please contact school support for assistance.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: keyof FormData): string | undefined => {
    if (!touched[field]) return undefined;
    
    switch (field) {
      case 'admissionNumber':
        if (!form.admissionNumber.trim()) return 'Admission number is required';
        if (form.admissionNumber.length < 5) return 'Admission number seems too short';
        break;
      case 'dateOfBirth':
        if (!form.dateOfBirth) return 'Date of birth is required';
        const age = new Date().getFullYear() - new Date(form.dateOfBirth).getFullYear();
        if (age < 3 || age > 20) return 'Date of birth seems unusual';
        break;
      case 'relationship':
        if (!form.relationship.trim()) return 'Relationship is required';
        break;
      case 'studentEmail':
        if (form.studentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.studentEmail)) {
          return 'Please enter a valid email address';
        }
        break;
    }
    return undefined;
  };

  return (
    <Card className={clsx('overflow-hidden', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Link Existing Student
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connect your child who is already enrolled at the school
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Admission Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Admission Number *
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={form.admissionNumber}
              onChange={(e) => handleFieldChange('admissionNumber', e.target.value)}
              onBlur={() => handleBlur('admissionNumber')}
              className={clsx(
                'w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                getFieldError('admissionNumber') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder="e.g., 2026-F1A-001"
              disabled={submitting}
            />
          </div>
          {getFieldError('admissionNumber') && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {getFieldError('admissionNumber')}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter your child's admission number from their school ID card
          </p>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date of Birth *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
              onBlur={() => handleBlur('dateOfBirth')}
              className={clsx(
                'w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                getFieldError('dateOfBirth') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              )}
              disabled={submitting}
            />
          </div>
          {getFieldError('dateOfBirth') && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {getFieldError('dateOfBirth')}
            </p>
          )}
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Relationship to Student *
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={form.relationship}
              onChange={(e) => handleFieldChange('relationship', e.target.value)}
              onBlur={() => handleBlur('relationship')}
              className={clsx(
                'w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                getFieldError('relationship') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              )}
              disabled={submitting}
            >
              {RELATIONSHIP_OPTIONS.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
          {getFieldError('relationship') && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {getFieldError('relationship')}
            </p>
          )}
        </div>

        {/* Student Email (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Student Email (Optional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={form.studentEmail}
              onChange={(e) => handleFieldChange('studentEmail', e.target.value)}
              onBlur={() => handleBlur('studentEmail')}
              className={clsx(
                'w-full pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                getFieldError('studentEmail') 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              )}
              placeholder="student@school.edu"
              disabled={submitting}
            />
          </div>
          {getFieldError('studentEmail') && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {getFieldError('studentEmail')}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Providing the student's email helps verify the connection
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
          <div className="flex gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Verification Process</p>
              <p>After submitting, the school will verify the relationship. Once approved, the student will appear in your dashboard automatically.</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-700 dark:text-green-300">{message}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            type="submit"
            disabled={submitting}
            isLoading={submitting}
            icon={<Link2 className="w-4 h-4" />}
            fullWidth
          >
            Link Student
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          By linking, you confirm that you have the legal right to access this student's information
        </p>
      </form>
    </Card>
  );
}