import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapSelector.css';

// Fix for Leaflet marker icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// MapUpdater component to fly to location when search is successful
function MapUpdater({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, 13);
    }
  }, [center, map]);
  
  return null;
}

function LocationMarker({ position, setPosition }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    }
  });

  return position ? <Marker position={position} /> : null;
}

function MapSelector({ onLocationSelect, initialLocation }) {
  const [position, setPosition] = useState(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const defaultCenter = initialLocation || { lat: 40.7128, lng: -74.0060 }; // Default: New York
  
  useEffect(() => {
    if (position) {
      onLocationSelect(position);
    }
  }, [position, onLocationSelect]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Using Nominatim geocoding service (OpenStreetMap)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.length === 0) {
        setError('No locations found. Try a different search term.');
        setSearchResults([]);
      } else {
        setSearchResults(data.map(item => ({
          name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon)
        })));
      }
    } catch (error) {
      console.error('Error searching for location:', error);
      setError('Failed to search for location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    const newPosition = { lat: result.lat, lng: result.lon };
    setPosition(newPosition);
    setSearchResults([]);
    setSearchQuery('');
  };

  return (
    <div className="map-selector">
      <div className="location-search">
        <form onSubmit={handleSearch}>
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="search-input"
            />
            <button type="submit" className="search-button" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
        
        {error && <div className="search-error">{error}</div>}
        
        {searchResults.length > 0 && (
          <div className="search-results">
            <ul>
              {searchResults.map((result, index) => (
                <li key={index} onClick={() => handleSelectSearchResult(result)}>
                  {result.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="map-container">
        <MapContainer 
          center={defaultCenter} 
          zoom={13} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
          <MapUpdater center={position} />
        </MapContainer>
      </div>
      
      <div className="map-instructions">
        <p>Click on the map to select a location or use the search bar above</p>
        {position && (
          <div className="selected-location">
            <p>Selected Location:</p>
            <p>Latitude: {position.lat.toFixed(6)}</p>
            <p>Longitude: {position.lng.toFixed(6)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapSelector; 