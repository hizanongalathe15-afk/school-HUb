export interface School {
  id: string;
  name: string;
  motto?: string;
  mission?: string;
  vision?: string;
  founded?: number;
  founder?: string;
  phone: string;
  email: string;
  website?: string;
  address: string;
  location: {
    lat: number;
    lng: number;
    region: string;
  };
  soilInfo?: {
    type: string;
    fertility: string;
    description: string;
  };
  roadsInfo?: {
    access: string[];
    distance: string;
    condition: string;
  };
  surroundings?: {
    landmarks: string[];
    nearbyTowns: string[];
  };
  climate?: {
    type: string;
    rainfall: string;
    temperature: string;
  };
  logo?: string;
  coverImage?: string;
  theme?: {
    primaryColor: string;
    secondaryColor: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SchoolLocation {
  id: string;
  schoolId: string;
  lat: number;
  lng: number;
  address: string;
  region: string;
}