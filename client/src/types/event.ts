export interface EventMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  name: string;
  size?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  endDate: string;
  type: 'ACADEMIC' | 'SPORTS' | 'CULTURAL' | 'MEETING';
  location?: string;
  participants?: string[];
  image?: string;
  images?: string[];
  videos?: string[];
  media?: EventMedia[];
}

export interface News {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  image?: string;
}