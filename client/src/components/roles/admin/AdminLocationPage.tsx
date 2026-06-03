// client/src/components/roles/admin/AdminLocationPage.tsx
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  MapPin, Phone, Mail, Globe, Edit, Save, X, Camera, Upload,
  Image, Video, Clock, Calendar, Droplets, Wind, Thermometer,
  Gauge, Compass, Navigation, Target, Crosshair, ZoomIn, ZoomOut,
  Layers, Map, Satellite, Sun, Cloud, CloudRain, Wind as WindIcon,
  Droplets as DropletsIcon, Thermometer as ThermometerIcon,
  Activity, BarChart3, PieChart, TrendingUp, TrendingDown,
  RefreshCw, CheckCircle, AlertCircle, AlertTriangle, Info,
  Download, Share2, Copy, Link, ExternalLink, Printer,
  Plus, Trash2, Eye, EyeOff, Star, Heart, Award, Trophy
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminDashboardService } from '../../../services/adminService';

interface LocationData {
  schoolName: string;
  motto: string;
  address: string;
  city: string;
  county: string;
  subCounty: string;
  ward: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  latitude: number;
  longitude: number;
  zoom: number;
}

interface EnvironmentData {
  climate: string;
  rainfall: string;
  temperature: string;
  altitude: string;
  soilType: string;
  vegetation: string;
  nearbyTowns: string[];
  landmarks: string[];
  roadDistance: string;
  publicTransport: boolean;
  nearestAirport: string;
  airQuality: number;
  uvIndex: number;
  humidity: number;
}

interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'drone';
  url: string;
  title: string;
  description: string;
  uploadedAt: string;
  isPrimary: boolean;
}

export default function AdminLocationPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'location' | 'environment' | 'media' | 'map'>('location');
  const [location, setLocation] = useState<LocationData>({
    schoolName: 'School Hub Academy',
    motto: 'Excellence in Education',
    address: '',
    city: '',
    county: '',
    subCounty: '',
    ward: '',
    postalCode: '',
    country: 'Kenya',
    phone: '',
    email: '',
    website: '',
    facebook: '',
    twitter: '',
    instagram: '',
    youtube: '',
    latitude: -1.2921,
    longitude: 36.8219,
    zoom: 15
  });
  const [environment, setEnvironment] = useState<EnvironmentData>({
    climate: '',
    rainfall: '',
    temperature: '',
    altitude: '',
    soilType: '',
    vegetation: '',
    nearbyTowns: [],
    landmarks: [],
    roadDistance: '',
    publicTransport: true,
    nearestAirport: '',
    airQuality: 75,
    uvIndex: 8,
    humidity: 65
  });
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (!document.querySelector('#google-maps-script')) {
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places,geometry&callback=initMap`;
        script.async = true;
        script.defer = true;
        (window as any).initMap = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (mapContainerRef.current && (window as any).google) {
        const map = new (window as any).google.maps.Map(mapContainerRef.current, {
          center: { lat: location.latitude, lng: location.longitude },
          zoom: location.zoom,
          mapTypeId: mapType,
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true
        });
        mapRef.current = map;

        const marker = new (window as any).google.maps.Marker({
          position: { lat: location.latitude, lng: location.longitude },
          map: map,
          draggable: editing,
          animation: (window as any).google.maps.Animation.DROP,
          title: location.schoolName
        });
        markerRef.current = marker;

        marker.addListener('dragend', () => {
          const newPos = marker.getPosition();
          setLocation(prev => ({
            ...prev,
            latitude: newPos.lat(),
            longitude: newPos.lng()
          }));
          toast('Location pin moved. Save to update.');
        });

        // Add click listener to map
        map.addListener('click', (e: any) => {
          if (editing) {
            marker.setPosition(e.latLng);
            setLocation(prev => ({
              ...prev,
              latitude: e.latLng.lat(),
              longitude: e.latLng.lng()
            }));
          }
        });
      }
    };

    loadGoogleMaps();
  }, [mapType, editing]);

  // Load data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [locationData, envData, mediaData] = await Promise.all([
        adminDashboardService.getLocation(),
        adminDashboardService.getEnvironment(),
        adminDashboardService.getLocationMedia()
      ]);
      if (locationData) setLocation(prev => ({ ...prev, ...locationData }));
      if (envData) setEnvironment(prev => ({ ...prev, ...envData }));
      if (mediaData) setMediaFiles(mediaData);
      
      // Fetch weather data
      fetchWeather(locationData?.latitude || location.latitude, locationData?.longitude || location.longitude);
    } catch (e) {
      toast.error('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lng: number) => {
    try {
      // Using OpenWeatherMap API (replace with your API key)
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=YOUR_API_KEY&units=metric`);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Weather fetch failed');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Search address using Google Places
  const searchAddressHandler = () => {
    if (!searchAddress.trim() || !(window as any).google) return;
    
    const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
    const request = {
      query: searchAddress,
      fields: ['geometry', 'formatted_address', 'name']
    };
    
    service.findPlaceFromQuery(request, (results: any[], status: any) => {
      if (status === 'OK' && results[0]) {
        const place = results[0];
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        mapRef.current?.setCenter({ lat, lng });
        mapRef.current?.setZoom(17);
        markerRef.current?.setPosition({ lat, lng });
        
        setLocation(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: place.formatted_address || prev.address
        }));
        
        toast.success('Location found on map');
      } else {
        toast.error('Location not found');
      }
    });
  };

  const handleMediaUpload = async (files: FileList | null, type: 'image' | 'video' | 'drone') => {
    if (!files?.length) return;
    setUploading(true);
    
    const newMedia: MediaFile[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10_000_000) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const uploaded = await adminDashboardService.uploadLocationMedia(formData);
        newMedia.push(uploaded);
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }
    
    setMediaFiles(prev => [...prev, ...newMedia]);
    setUploading(false);
    toast.success(`${newMedia.length} file(s) uploaded`);
  };

  const handleSetPrimary = (mediaId: string) => {
    setMediaFiles(prev => prev.map(m => ({
      ...m,
      isPrimary: m.id === mediaId
    })));
    toast.success('Primary media set');
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Delete this media?')) return;
    await adminDashboardService.deleteLocationMedia(mediaId);
    setMediaFiles(prev => prev.filter(m => m.id !== mediaId));
    toast.success('Media deleted');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        adminDashboardService.updateLocation(location),
        adminDashboardService.updateEnvironment(environment)
      ]);
      toast.success('Location data saved successfully');
      setEditing(false);
    } catch (e) {
      toast.error('Failed to save location data');
    } finally {
      setSaving(false);
    }
  };

  const handleReverseGeocode = async () => {
    if (!(window as any).google) return;
    
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode(
      { location: { lat: location.latitude, lng: location.longitude } },
      (results: any[], status: any) => {
        if (status === 'OK' && results[0]) {
          setLocation(prev => ({ ...prev, address: results[0].formatted_address }));
          toast.success('Address updated from coordinates');
        }
      }
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`, '_blank');
  };

  if (loading) {
    return (
      <div className="location-page">
        <div className="loader-container"><div className="spinner"></div><p>Loading location data...</p></div>
      </div>
    );
  }

  return (
    <div className="location-page">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1><MapPin size={28} /> Location & Environment</h1>
          <p>Manage school location, map pin, environment data, and media gallery</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn-secondary"><RefreshCw size={16} /> Refresh</button>
          <button onClick={() => openInGoogleMaps()} className="btn-secondary"><ExternalLink size={16} /> Open in Maps</button>
          <button onClick={() => editing ? handleSave() : setEditing(true)} className="btn-primary" disabled={saving}>
            {editing ? <><Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}</> : <><Edit size={16} /> Edit Mode</>}
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="tabs">
        {['location', 'environment', 'media', 'map'].map(tab => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab as any)}>
            {tab === 'location' && '📍 Location Info'}
            {tab === 'environment' && '🌍 Environment'}
            {tab === 'media' && '📸 Media Gallery'}
            {tab === 'map' && '🗺️ Interactive Map'}
          </button>
        ))}
      </nav>

      {/* Location Tab */}
      {activeTab === 'location' && (
        <div className="tab-content">
          {/* Weather Widget */}
          {weatherData && (
            <div className="weather-widget">
              <div className="weather-icon">
                {weatherData.weather?.[0]?.main === 'Clear' && <Sun size={32} />}
                {weatherData.weather?.[0]?.main === 'Clouds' && <Cloud size={32} />}
                {weatherData.weather?.[0]?.main === 'Rain' && <CloudRain size={32} />}
              </div>
              <div className="weather-info">
                <strong>{weatherData.name}</strong>
                <span>{weatherData.main?.temp}°C</span>
                <span>{weatherData.weather?.[0]?.description}</span>
              </div>
              <div className="weather-details">
                <div><WindIcon size={14} /> {weatherData.wind?.speed} km/h</div>
                <div><DropletsIcon size={14} /> {weatherData.main?.humidity}%</div>
              </div>
            </div>
          )}

          <div className="forms-grid">
            {/* School Information */}
            <div className="info-card">
              <h3>🏫 School Information</h3>
              <div className="form-group"><label>School Name</label><input name="schoolName" value={location.schoolName} onChange={e => setLocation({...location, schoolName: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label>Motto / Tagline</label><input name="motto" value={location.motto} onChange={e => setLocation({...location, motto: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label>Full Address</label><input name="address" value={location.address} onChange={e => setLocation({...location, address: e.target.value})} disabled={!editing} /></div>
              <div className="form-row"><div className="form-group"><label>City</label><input value={location.city} onChange={e => setLocation({...location, city: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label>County</label><input value={location.county} onChange={e => setLocation({...location, county: e.target.value})} disabled={!editing} /></div></div>
              <div className="form-row"><div className="form-group"><label>Sub-County</label><input value={location.subCounty} onChange={e => setLocation({...location, subCounty: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label>Ward</label><input value={location.ward} onChange={e => setLocation({...location, ward: e.target.value})} disabled={!editing} /></div></div>
              <div className="form-row"><div className="form-group"><label>Postal Code</label><input value={location.postalCode} onChange={e => setLocation({...location, postalCode: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label>Country</label><input value={location.country} onChange={e => setLocation({...location, country: e.target.value})} disabled={!editing} /></div></div>
            </div>

            {/* Contact Information */}
            <div className="info-card">
              <h3>📞 Contact Information</h3>
              <div className="form-group"><label><Phone size={14} /> Phone</label><input value={location.phone} onChange={e => setLocation({...location, phone: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label><Mail size={14} /> Email</label><input value={location.email} onChange={e => setLocation({...location, email: e.target.value})} disabled={!editing} /></div>
              <div className="form-group"><label><Globe size={14} /> Website</label><input value={location.website} onChange={e => setLocation({...location, website: e.target.value})} disabled={!editing} /></div>
              <div className="social-links">
                <input placeholder="Facebook URL" value={location.facebook} onChange={e => setLocation({...location, facebook: e.target.value})} disabled={!editing} />
                <input placeholder="Twitter URL" value={location.twitter} onChange={e => setLocation({...location, twitter: e.target.value})} disabled={!editing} />
                <input placeholder="Instagram URL" value={location.instagram} onChange={e => setLocation({...location, instagram: e.target.value})} disabled={!editing} />
                <input placeholder="YouTube URL" value={location.youtube} onChange={e => setLocation({...location, youtube: e.target.value})} disabled={!editing} />
              </div>
            </div>

            {/* Coordinates */}
            <div className="info-card">
              <h3>📍 GPS Coordinates</h3>
              <div className="coord-display">
                <div><strong>Latitude:</strong> {location.latitude}</div>
                <div><strong>Longitude:</strong> {location.longitude}</div>
                <div className="coord-actions">
                  <button onClick={handleReverseGeocode} className="btn-sm"><MapPin size={14} /> Get Address</button>
                  <button onClick={() => copyToClipboard(`${location.latitude}, ${location.longitude}`, 'Coordinates')} className="btn-sm"><Copy size={14} /> Copy</button>
                </div>
              </div>
              {editing && (
                <div className="coord-edit">
                  <label>Latitude</label><input type="number" step="any" value={location.latitude} onChange={e => setLocation({...location, latitude: parseFloat(e.target.value)})} />
                  <label>Longitude</label><input type="number" step="any" value={location.longitude} onChange={e => setLocation({...location, longitude: parseFloat(e.target.value)})} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Environment Tab */}
      {activeTab === 'environment' && (
        <div className="tab-content">
          <div className="forms-grid">
            <div className="info-card">
              <h3>🌤️ Climate & Weather</h3>
              <div className="form-row"><div className="form-group"><label>Climate Type</label><input value={environment.climate} onChange={e => setEnvironment({...environment, climate: e.target.value})} disabled={!editing} placeholder="e.g., Tropical, Semi-arid" /></div>
              <div className="form-group"><label>Annual Rainfall</label><input value={environment.rainfall} onChange={e => setEnvironment({...environment, rainfall: e.target.value})} disabled={!editing} placeholder="e.g., 800mm" /></div></div>
              <div className="form-row"><div className="form-group"><label>Average Temperature</label><input value={environment.temperature} onChange={e => setEnvironment({...environment, temperature: e.target.value})} disabled={!editing} placeholder="e.g., 22°C" /></div>
              <div className="form-group"><label>Altitude</label><input value={environment.altitude} onChange={e => setEnvironment({...environment, altitude: e.target.value})} disabled={!editing} placeholder="e.g., 1500m" /></div></div>
              <div className="environment-metrics">
                <div><Gauge size={16} /> Air Quality: {environment.airQuality}%</div>
                <div><Sun size={16} /> UV Index: {environment.uvIndex}</div>
                <div><Droplets size={16} /> Humidity: {environment.humidity}%</div>
              </div>
            </div>

            <div className="info-card">
              <h3>🌱 Soil & Vegetation</h3>
              <div className="form-group"><label>Soil Type</label><input value={environment.soilType} onChange={e => setEnvironment({...environment, soilType: e.target.value})} disabled={!editing} placeholder="e.g., Volcanic, Loam, Clay" /></div>
              <div className="form-group"><label>Vegetation</label><input value={environment.vegetation} onChange={e => setEnvironment({...environment, vegetation: e.target.value})} disabled={!editing} placeholder="e.g., Savannah, Forest" /></div>
            </div>

            <div className="info-card">
              <h3>🏘️ Surroundings & Access</h3>
              <div className="form-group"><label>Nearby Towns (comma separated)</label><input value={environment.nearbyTowns?.join(', ')} onChange={e => setEnvironment({...environment, nearbyTowns: e.target.value.split(',').map(s => s.trim())})} disabled={!editing} /></div>
              <div className="form-group"><label>Landmarks (comma separated)</label><input value={environment.landmarks?.join(', ')} onChange={e => setEnvironment({...environment, landmarks: e.target.value.split(',').map(s => s.trim())})} disabled={!editing} /></div>
              <div className="form-group"><label>Distance from Main Road</label><input value={environment.roadDistance} onChange={e => setEnvironment({...environment, roadDistance: e.target.value})} disabled={!editing} placeholder="e.g., 2km" /></div>
              <div className="form-group"><label>Nearest Airport</label><input value={environment.nearestAirport} onChange={e => setEnvironment({...environment, nearestAirport: e.target.value})} disabled={!editing} /></div>
              <div className="checkbox-group"><label><input type="checkbox" checked={environment.publicTransport} onChange={e => setEnvironment({...environment, publicTransport: e.target.checked})} disabled={!editing} /> Public Transport Available</label></div>
            </div>
          </div>
        </div>
      )}

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="tab-content">
          <div className="media-header">
            <h3>📸 Location Media Gallery</h3>
            <button className="btn-primary btn-sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload size={16} /> Upload Media
            </button>
          </div>
          <input ref={fileInputRef} type="file" multiple accept="image/*,video/*" style={{ display: 'none' }} onChange={e => e.target.files && handleMediaUpload(e.target.files, 'image')} />
          
          {uploading && <div className="upload-progress"><div className="progress-bar" style={{ width: '60%' }}></div><span>Uploading...</span></div>}
          
          <div className="media-grid">
            {mediaFiles.map(media => (
              <div key={media.id} className="media-card">
                {media.type === 'image' ? (
                  <img src={media.url} alt={media.title} />
                ) : (
                  <video src={media.url} controls />
                )}
                {media.isPrimary && <span className="primary-badge">⭐ Primary</span>}
                <div className="media-overlay">
                  <button onClick={() => handleSetPrimary(media.id)} title="Set as Primary"><Star size={14} /></button>
                  <button onClick={() => handleDeleteMedia(media.id)} className="danger"><Trash2 size={14} /></button>
                </div>
                <div className="media-info">
                  <span className="media-type">{media.type}</span>
                  <span className="media-date">{new Date(media.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {mediaFiles.length === 0 && <div className="empty-media">No media files. Upload images of the school, drone shots, and videos.</div>}
          </div>
        </div>
      )}

      {/* Map Tab */}
      {activeTab === 'map' && (
        <div className="tab-content">
          <div className="map-tools">
            <div className="search-address">
              <input ref={searchInputRef} type="text" placeholder="Search for an address..." value={searchAddress} onChange={e => setSearchAddress(e.target.value)} onKeyPress={e => e.key === 'Enter' && searchAddressHandler()} />
              <button onClick={searchAddressHandler} className="btn-primary btn-sm"><Search size={16} /> Search</button>
            </div>
            <div className="map-controls">
              <button onClick={() => setMapType('roadmap')} className={mapType === 'roadmap' ? 'active' : ''}><Map size={16} /> Road</button>
              <button onClick={() => setMapType('satellite')} className={mapType === 'satellite' ? 'active' : ''}><Satellite size={16} /> Satellite</button>
              <button onClick={() => setMapType('terrain')} className={mapType === 'terrain' ? 'active' : ''}><Layers size={16} /> Terrain</button>
              <button onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}><ZoomIn size={16} /></button>
              <button onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}><ZoomOut size={16} /></button>
              <button onClick={() => mapRef.current?.setCenter({ lat: location.latitude, lng: location.longitude })}><Crosshair size={16} /> Recenter</button>
            </div>
          </div>
          <div ref={mapContainerRef} className="google-map"></div>
          {editing && (
            <div className="map-edit-note">
              <Info size={14} /> Edit mode: Drag the pin or click anywhere on the map to change location
            </div>
          )}
        </div>
      )}

      <style>{`
        .location-page { padding: 24px; background: #f8fafc; min-height: 100vh; }
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-header h1 { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin: 0; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn-primary { background: #1d8a8a; color: white; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 12px; }
        .tabs { display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
        .tabs button { padding: 10px 20px; background: none; border: none; cursor: pointer; font-weight: 500; color: #64748b; }
        .tabs button.active { color: #1d8a8a; border-bottom: 2px solid #1d8a8a; }
        .tab-content { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .weather-widget { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 20px; border-radius: 12px; display: flex; align-items: center; gap: 20px; margin-bottom: 24px; flex-wrap: wrap; }
        .weather-info { flex: 1; }
        .weather-info strong { display: block; font-size: 18px; }
        .weather-info span { font-size: 14px; opacity: 0.9; }
        .weather-details { display: flex; gap: 16px; font-size: 13px; }
        .forms-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
        .info-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .info-card h3 { margin: 0 0 16px 0; font-size: 16px; }
        .form-group { margin-bottom: 12px; }
        .form-group label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: #475569; }
        .form-group input, .social-links input { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .form-group input:disabled, .social-links input:disabled { background: #f8fafc; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .social-links { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .coord-display { background: #f1f5f9; padding: 12px; border-radius: 8px; margin-bottom: 12px; }
        .coord-display div { margin: 4px 0; font-family: monospace; }
        .coord-actions { display: flex; gap: 8px; margin-top: 8px; }
        .coord-edit { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
        .coord-edit label { font-size: 11px; }
        .environment-metrics { display: flex; gap: 16px; margin-top: 12px; padding: 12px; background: #f1f5f9; border-radius: 8px; }
        .environment-metrics div { display: flex; align-items: center; gap: 6px; font-size: 12px; }
        .checkbox-group { margin-top: 12px; }
        .media-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .media-card { position: relative; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .media-card img, .media-card video { width: 100%; height: 160px; object-fit: cover; }
        .primary-badge { position: absolute; top: 8px; left: 8px; background: #f59e0b; color: white; font-size: 10px; padding: 2px 8px; border-radius: 12px; }
        .media-overlay { position: absolute; top: 0; right: 0; left: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: flex-end; gap: 8px; padding: 8px; opacity: 0; transition: opacity 0.2s; }
        .media-card:hover .media-overlay { opacity: 1; }
        .media-overlay button { background: white; border: none; border-radius: 4px; padding: 6px; cursor: pointer; }
        .media-overlay button.danger { color: #ef4444; }
        .media-info { padding: 8px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
        .empty-media { text-align: center; padding: 60px; color: #64748b; background: white; border-radius: 12px; }
        .map-tools { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
        .search-address { display: flex; gap: 8px; flex: 1; max-width: 400px; }
        .search-address input { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
        .map-controls { display: flex; gap: 8px; flex-wrap: wrap; }
        .map-controls button { padding: 6px 12px; background: white; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-size: 12px; }
        .map-controls button.active { background: #1d8a8a; color: white; border-color: #1d8a8a; }
        .google-map { height: 500px; border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
        .map-edit-note { padding: 8px 12px; background: #fef3c7; border-radius: 8px; font-size: 12px; color: #92400e; display: flex; align-items: center; gap: 8px; }
        .upload-progress { background: #e2e8f0; border-radius: 8px; height: 30px; overflow: hidden; margin: 16px 0; position: relative; }
        .upload-progress .progress-bar { background: #1d8a8a; height: 100%; width: 0%; transition: width 0.3s; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; }
        .loader-container { text-align: center; padding: 60px; }
        .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #1d8a8a; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Add missing import
import { Search } from 'lucide-react';