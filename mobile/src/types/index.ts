export * from './attendance';
export * from './fee';
export * from './student';
export * from './user';

export interface ParentMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  channel: 'Portal' | 'SMS' | 'WhatsApp' | 'Email';
  unread: boolean;
  createdAt: string;
}

export interface SchoolEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  consentRequired: boolean;
  status: 'Open' | 'Confirmed' | 'Closed';
}
