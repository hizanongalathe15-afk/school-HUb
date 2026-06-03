import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Phone, Mail, AlertCircle, CheckCircle, Zap, BookOpen } from 'lucide-react';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const ParentSupport: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'help' | 'faq' | 'contact' | 'technical'>('help');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    email: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const faqs: FAQ[] = [
    {
      id: '1',
      category: 'Fees',
      question: 'How do I pay fees online?',
      answer:
        'To pay fees online, navigate to the Fees section, select "Make Payment", choose your payment method (MPESA, Card, or Bank Transfer), enter the amount, and follow the payment instructions. You will receive a receipt immediately.',
    },
    {
      id: '2',
      category: 'Academic',
      question: 'When are results usually published?',
      answer:
        'Results are typically published two weeks after the end of term examinations. You will receive an SMS notification when your child\'s results are ready. You can view them in the Academic Performance section.',
    },
    {
      id: '3',
      category: 'Attendance',
      question: 'How can I report my child\'s absence?',
      answer:
        'Go to Attendance > Attendance Settings > "Report Child\'s Absence". Provide the date and reason for absence. The school will review and respond to your notification within 24 hours.',
    },
    {
      id: '4',
      category: 'Technical',
      question: 'I forgot my password. What should I do?',
      answer:
        'Click "Forgot Password" on the login page. Enter your registered email address, and you\'ll receive a password reset link. Follow the instructions to create a new password.',
    },
    {
      id: '5',
      category: 'Meetings',
      question: 'How do I book a parent-teacher meeting?',
      answer:
        'Go to Meetings > "Book Meetings". Select the teacher, preferred date and time slot, add your meeting topic, and submit. You\'ll receive a confirmation SMS and calendar invite.',
    },
    {
      id: '6',
      category: 'Communication',
      question: 'Can I message teachers directly?',
      answer:
        'Yes, go to Messages to access the chat interface. You can message your child\'s class teacher or individual subject teachers. Messages are available during school hours.',
    },
    {
      id: '7',
      category: 'Data',
      question: 'Why is my child\'s data not showing?',
      answer:
        'Ensure your child is properly linked to your account. Go to "My Children" and verify the link. If data is still missing, contact technical support with your child\'s admission number.',
    },
    {
      id: '8',
      category: 'Transport',
      question: 'How does real-time bus tracking work?',
      answer:
        'The bus location updates every 30 seconds. Go to Transport > "Live Tracking" to view your child\'s bus in real-time on the map. The estimated arrival time is calculated based on current traffic.',
    },
    {
      id: '9',
      category: 'Health',
      question: 'How do I update my child\'s medical information?',
      answer:
        'Go to Health & Medical > Medical Records. You can add allergies, chronic conditions, medications, and emergency contacts. Changes are immediately synced with the school\'s medical office.',
    },
    {
      id: '10',
      category: 'Boarding',
      question: 'How do I request leave for my boarding child?',
      answer:
        'Go to Boarding > "Leave Requests". Enter the dates, select the reason, and submit. The request goes to the class teacher and principal for approval. You\'ll receive an SMS notification with the decision.',
    },
  ];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setContactForm({ subject: '', email: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (err) {
      setSubmitStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Support & Help</h1>
          <p className="text-gray-600 dark:text-gray-400">Get help using the parent portal</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('help')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'help'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <BookOpen className="inline mr-2 w-4 h-4" />
            Getting Started
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'faq'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <HelpCircle className="inline mr-2 w-4 h-4" />
            FAQ
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'contact'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare className="inline mr-2 w-4 h-4" />
            Contact Us
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-6 py-3 font-medium border-b-2 transition whitespace-nowrap ${
              activeTab === 'technical'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
            }`}
          >
            <Zap className="inline mr-2 w-4 h-4" />
            Technical Support
          </button>
        </div>

        {/* Getting Started Tab */}
        {activeTab === 'help' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Welcome to Parent Portal</h2>
              <div className="prose dark:prose-invert max-w-none space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  The Parent Portal is your one-stop platform to stay connected with your child's academic progress, fees,
                  attendance, and school activities. Here's how to get started:
                </p>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      Step 1: Link Your Children
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Go to "My Children" and link your child using their admission number. You can manage multiple children
                      from a single account.
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      Step 2: View Academic Information
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Access your child's results, attendance, timetable, and homework in the Academic section. Monitor
                      performance trends and set alerts.
                    </p>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      Step 3: Manage Fees
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Pay fees securely online via MPESA, card, or bank transfer. View payment history and fee statements
                      anytime.
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      Step 4: Communicate with Teachers
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Send messages to teachers, book parent-teacher meetings, and join video conferences without
                      downloading additional software.
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                      Step 5: Stay Informed
                    </h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Enable notifications to receive real-time alerts about your child's attendance, fees due, exam dates,
                      and school announcements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Pro Tips
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Bookmark this page for quick access</li>
                <li>Download the mobile app for on-the-go access</li>
                <li>Enable push notifications for important updates</li>
                <li>Update your contact information regularly</li>
                <li>Use the search feature to find information quickly</li>
              </ul>
            </div>
          </div>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left flex justify-between items-center"
                >
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{faq.category}</p>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                  </div>
                  <span className={`ml-4 text-gray-600 dark:text-gray-400 transition ${expandedFAQ === faq.id ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-gray-700 dark:text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Us Tab */}
        {activeTab === 'contact' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-500" />
                  Phone
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">Main:</span> +254 (0) 722 123 456
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Bursar Office:</span> +254 (0) 722 123 789
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">Available: Monday - Friday, 8 AM - 5 PM</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-500" />
                  Email
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">General:</span> support@school.ac.ke
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium">Technical:</span> tech@school.ac.ke
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Fees:</span> bursar@school.ac.ke
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">Response time: Within 24 hours</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Send us a Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Subject</label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="What is this about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
                  <textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitStatus === 'submitting'}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {submitStatus === 'submitting' ? 'Sending...' : 'Send Message'}
                </button>
                {submitStatus === 'success' && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
                    Message sent successfully! We'll respond within 24 hours.
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Technical Support Tab */}
        {activeTab === 'technical' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Common Technical Issues</h3>
              <div className="space-y-4">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Can't log in?</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                    <li>Clear your browser cache and cookies</li>
                    <li>Try a different browser or incognito mode</li>
                    <li>Click "Forgot Password" to reset</li>
                    <li>Ensure JavaScript is enabled</li>
                    <li>Check your internet connection</li>
                  </ul>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Page not loading?</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                    <li>Refresh the page (F5 or Cmd+R)</li>
                    <li>Check if school's website is accessible</li>
                    <li>Disable browser extensions and ad blockers</li>
                    <li>Try updating your browser</li>
                    <li>Contact tech support if problem persists</li>
                  </ul>
                </div>

                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Payment not processing?</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                    <li>Check your internet connection</li>
                    <li>Verify MPESA balance or card details</li>
                    <li>Wait 2-3 minutes before trying again</li>
                    <li>Contact Safaricom for MPESA issues</li>
                    <li>Email tech@school.ac.ke with receipt</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Data not visible?</h4>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc list-inside space-y-1">
                    <li>Verify child is properly linked</li>
                    <li>Check if term data has been uploaded</li>
                    <li>Wait 24-48 hours after term ends</li>
                    <li>Email admission number to tech@school.ac.ke</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                System Status
              </h3>
              <div className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
                <p><span className="font-medium">Current Status:</span> <span className="text-green-600 dark:text-green-400">✓ Online</span></p>
                <p><span className="font-medium">Last Backup:</span> Today at 2:00 AM</p>
                <p><span className="font-medium">Scheduled Maintenance:</span> Sundays 2:00 AM - 4:00 AM</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Still Need Help?</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you're still experiencing issues, our technical support team is ready to help:
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Email:</span> tech@school.ac.ke
                </p>
                <p className="text-sm">
                  <span className="font-medium">WhatsApp:</span> +254 722 123 456
                </p>
                <p className="text-sm">
                  <span className="font-medium">Hours:</span> Monday - Friday, 8 AM - 6 PM
                </p>
              </div>
              <button className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
                Submit Technical Issue Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentSupport;
