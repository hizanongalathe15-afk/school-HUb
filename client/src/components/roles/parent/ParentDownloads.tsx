import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { 
  Download, 
  FileText, 
  File, 
  FileCheck, 
  Calendar, 
  BookOpen,
  Shield,
  Heart,
  CreditCard,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Search,
  Eye,
  Printer,
  FolderOpen,
  CloudDownload
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Spinner } from '../../ui/Spinner';
import { clsx } from 'clsx';
import parentService from '../../../services/parentService';
import type { ParentApiResponse } from '../../../types/parent';

type DownloadKey = 
  | 'fee-receipt'
  | 'admission-letter'
  | 'school-forms'
  | 'consent-form'
  | 'medical-form'
  | 'brochure'
  | 'calendar'
  | 'report-card'
  | 'timetable'
  | 'sports-form';

interface DownloadCard {
  key: DownloadKey;
  label: string;
  helper: string;
  icon: React.ReactNode;
  requiresId?: boolean;
  idLabel?: string;
  idPlaceholder?: string;
}

const ParentDownloads: React.FC = () => {
  const [downloadingKey, setDownloadingKey] = useState<DownloadKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [admissionRef, setAdmissionRef] = useState('');
  const [studentId, setStudentId] = useState('');
  const [downloadHistory, setDownloadHistory] = useState<Array<{ key: string; date: Date; filename: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const cards = useMemo<DownloadCard[]>(() => [
    { 
      key: 'school-forms', 
      label: 'School Forms', 
      helper: 'Download all available school registration forms',
      icon: <FileText className="w-5 h-5" />
    },
    { 
      key: 'consent-form', 
      label: 'Consent Forms', 
      helper: 'Consent & permission documents for activities',
      icon: <Shield className="w-5 h-5" />
    },
    { 
      key: 'medical-form', 
      label: 'Medical Forms', 
      helper: 'Health & medical document templates',
      icon: <Heart className="w-5 h-5" />
    },
    { 
      key: 'fee-receipt', 
      label: 'Fee Receipts', 
      helper: 'Download individual fee receipts',
      icon: <CreditCard className="w-5 h-5" />,
      requiresId: true,
      idLabel: 'Receipt Number',
      idPlaceholder: 'Enter receipt number (e.g., RCP-2024-001)'
    },
    { 
      key: 'admission-letter', 
      label: 'Admission Letter', 
      helper: 'Download your child\'s admission letter',
      icon: <GraduationCap className="w-5 h-5" />,
      requiresId: true,
      idLabel: 'Admission Reference',
      idPlaceholder: 'Enter admission number or reference'
    },
    { 
      key: 'calendar', 
      label: 'School Calendar', 
      helper: 'Term dates, holidays, and school events',
      icon: <Calendar className="w-5 h-5" />
    },
    { 
      key: 'brochure', 
      label: 'School Brochure', 
      helper: 'Official school information brochure',
      icon: <BookOpen className="w-5 h-5" />
    },
    { 
      key: 'report-card', 
      label: 'Report Card', 
      helper: 'Download academic report cards',
      icon: <FileCheck className="w-5 h-5" />,
      requiresId: true,
      idLabel: 'Student ID',
      idPlaceholder: 'Select or enter student ID'
    },
    { 
      key: 'timetable', 
      label: 'Timetable', 
      helper: 'Class schedules and subject timetables',
      icon: <FolderOpen className="w-5 h-5" />
    },
    { 
      key: 'sports-form', 
      label: 'Sports Registration', 
      helper: 'Sports activities registration forms',
      icon: <File className="w-5 h-5" />
    }
  ], []);

  const download = useCallback(async (key: DownloadKey, identifier?: string) => {
    setDownloadingKey(key);
    setError(null);
    setSuccess(null);
    
    try {
      setLoading(true);

      let blob: Blob;
      let filename = `${key}_${new Date().toISOString().split('T')[0]}.pdf`;

      switch (key) {
        case 'brochure':
          blob = await parentService.downloads.downloadBrochure();
          filename = `school_brochure_${new Date().getFullYear()}.pdf`;
          break;
        case 'calendar':
          blob = await parentService.downloads.downloadCalendar();
          filename = `school_calendar_${new Date().getFullYear()}.pdf`;
          break;
        case 'fee-receipt':
          if (!identifier) throw new Error('Receipt ID required');
          blob = await parentService.downloads.downloadFeeReceipt(identifier);
          filename = `fee_receipt_${identifier}.pdf`;
          break;
        case 'admission-letter':
          if (!identifier) throw new Error('Admission reference required');
          blob = await parentService.downloads.downloadAdmissionLetter(identifier);
          filename = `admission_letter_${identifier}.pdf`;
          break;
        case 'report-card':
          if (!identifier) throw new Error('Student ID required');
          blob = await parentService.downloads.downloadReportCard(identifier);
          filename = `report_card_${identifier}_${new Date().getFullYear()}.pdf`;
          break;
        default:
          blob = await parentService.downloads.downloadForm(key);
          filename = `${key}_${new Date().toISOString().split('T')[0]}.pdf`;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      // Track download history
      setDownloadHistory(prev => [
        { key, date: new Date(), filename },
        ...prev.slice(0, 9) // Keep last 10
      ]);
      
      setSuccess(`${cards.find(c => c.key === key)?.label} downloaded successfully!`);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error('Download failed:', err);
      setError(err.message || 'Download failed. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
      setDownloadingKey(null);
    }
  }, [cards]);

  const handleDownloadWithId = useCallback((key: DownloadKey, id: string, setter: (val: string) => void) => {
    if (!id.trim()) {
      setError(`Please enter ${cards.find(c => c.key === key)?.idLabel || 'the required ID'}`);
      return;
    }
    download(key, id.trim());
    setter('');
  }, [download, cards]);

  const getCardIcon = useCallback((icon: React.ReactNode, isDownloading: boolean) => {
    if (isDownloading) {
      return <Spinner size="sm" />;
    }
    return icon;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-600" />
          Document Downloads
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Access and download school forms, reports, and official documents
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-600 dark:text-green-400">{success}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </Card>
      )}

      {/* Download Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.key} className="overflow-hidden hover:shadow-lg transition-all duration-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {card.label}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {card.helper}
                </p>
              </div>
            </div>

            {card.requiresId ? (
              <div className="space-y-2">
                {card.key === 'fee-receipt' && (
                  <div className="space-y-2">
                    <Input
                      placeholder={card.idPlaceholder}
                      value={receiptId}
                      onChange={(e) => setReceiptId(e.target.value)}
                      size="sm"
                    />
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleDownloadWithId(card.key, receiptId, setReceiptId)}
                      disabled={downloadingKey !== null || !receiptId.trim()}
                      isLoading={downloadingKey === card.key}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Receipt
                    </Button>
                  </div>
                )}
                
                {card.key === 'admission-letter' && (
                  <div className="space-y-2">
                    <Input
                      placeholder={card.idPlaceholder}
                      value={admissionRef}
                      onChange={(e) => setAdmissionRef(e.target.value)}
                      size="sm"
                    />
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleDownloadWithId(card.key, admissionRef, setAdmissionRef)}
                      disabled={downloadingKey !== null || !admissionRef.trim()}
                      isLoading={downloadingKey === card.key}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Letter
                    </Button>
                  </div>
                )}

                {card.key === 'report-card' && (
                  <div className="space-y-2">
                    <Input
                      placeholder={card.idPlaceholder}
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      size="sm"
                    />
                    <Button
                      size="sm"
                      fullWidth
                      onClick={() => handleDownloadWithId(card.key, studentId, setStudentId)}
                      disabled={downloadingKey !== null || !studentId.trim()}
                      isLoading={downloadingKey === card.key}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download Report
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button
                size="sm"
                fullWidth
                onClick={() => download(card.key)}
                disabled={downloadingKey !== null}
                isLoading={downloadingKey === card.key}
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Access Section */}
      <Card title="Quick Access">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Print All Forms</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Batch download available forms</p>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                cards.forEach(card => {
                  if (!card.requiresId) {
                    download(card.key);
                  }
                });
              }}
              disabled={downloadingKey !== null}
            >
              <CloudDownload className="w-4 h-4 mr-1" />
              Download All
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Need Help?</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Contact support for document assistance</p>
              </div>
            </div>
            <Button size="sm" variant="ghost">
              Contact Support
            </Button>
          </div>
        </div>
      </Card>

      {/* Download History */}
      {downloadHistory.length > 0 && (
        <Card title="Recent Downloads">
          <div className="space-y-2">
            {downloadHistory.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {cards.find(c => c.key === item.key)?.label || item.key}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.date.toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => download(item.key as DownloadKey)}
                  disabled={downloadingKey !== null}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        <p>All documents are generated on-demand and may contain personalized information.</p>
        <p className="mt-1">For issues with downloads, please contact the school administration.</p>
      </div>
    </div>
  );
};

export default ParentDownloads;