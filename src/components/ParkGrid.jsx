import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight, Info, X } from 'lucide-react';
import axios from 'axios';
import './ParkGrid.css';

const fallbackParks = [
  {
    id: 5,
    name: "WONDERLA",
    location: "Chennai, Tamil Nadu",
    rating: 4.9,
    price: "1500",
    adultPrice: 1500,
    kidsPrice: 1100,
    image: "/wonderla_final.jpg",
    desc: "The most popular theme park in India featuring world-class high-thrill rides and huge water parks.",
    about: "Founded in 2000, Wonderla spans 82 acres and is India's most visited theme park chain with 43+ rides, world-class safety standards, and over 2 million annual visitors.",
    features: ["Rewind Ride", "Equinox", "Maverick", "Flash Tower", "Rain Disco", "Wave Pool", "Turbo Tunnel", "Lazy River", "4D Theatre", "Go-Karting", "Water Pendulum"]
  },
  {
    id: 1,
    name: "VGP UNIVERSAL KINGDOM",
    location: "Chennai, Tamil Nadu",
    rating: 4.8,
    price: "1200",
    adultPrice: 1200,
    kidsPrice: 900,
    image: "/vgp-image.jpg",
    desc: "India's first and largest amusement park with over 45 thrilling rides and a private beach.",
    about: "India's oldest amusement park since 1975, VGP spans 45+ acres offering 45 rides, a private beach, snow park, live cultural shows and a haunted house.",
    features: ["Giant Wheel", "Roller Coaster", "Pirate Ship", "Break Dance", "Bumper Cars", "Snow Park", "Private Beach", "Wave Pool", "Haunted House", "Live Shows", "Splash Zone"]
  },
  {
    id: 2,
    name: "MGM DIZZEE WORLD",
    location: "Chennai, Tamil Nadu",
    rating: 4.6,
    price: "1000",
    adultPrice: 1000,
    kidsPrice: 750,
    image: "/mgm-image.jpg",
    desc: "The Pioneer of entertainment, offering world-class rides and a unique forest-themed water park.",
    about: "Launched in 1991 on Chennai's ECR coastline, MGM Dizzee World offers a forest-themed water park, ocean views, roller coasters and a dedicated kids adventure zone.",
    features: ["Roller Coaster", "Dizzee Castle", "Drop Zone", "Tagada", "Merry Go Round", "Forest Water Park", "Wave Pool", "Speed Slides", "Kiddies Pool", "Kids Zone", "Food Village"]
  },
  {
    id: 3,
    name: "QUEENS LAND",
    location: "Poonamallee, Chennai",
    rating: 4.5,
    price: "850",
    adultPrice: 850,
    kidsPrice: 600,
    image: "/queensland_final.png",
    desc: "An expansive theme park featuring 51 diverse rides suitable for all age groups.",
    about: "One of Tamil Nadu's largest parks with 51 rides for all ages, Queens Land features TN's largest cable car, a giant wave pool, and a dedicated toddler zone.",
    features: ["Cable Car", "Giant Wheel", "Columbus", "Roller Coaster", "Bumper Cars", "Wave Pool", "Rain Dance", "Splash Pad", "51 Rides", "Toddler Zone", "Panoramic Views"]
  },
  {
    id: 4,
    name: "BLACK THUNDER",
    location: "Mettupalayam, Coimbatore",
    rating: 4.7,
    price: "950",
    adultPrice: 950,
    kidsPrice: 700,
    image: "/black_thunder_final.jpg",
    desc: "Asia's No.1 water theme park with the majestic Nilgiris as a backdrop and extreme water slides.",
    about: "Asia's No.1 rated water theme park since 1991, Black Thunder sits at the Nilgiri foothills with 50+ attractions, extreme slides and a stunning mountain backdrop.",
    features: ["Black Hole Slide", "Kamikaze", "Tornado", "Wave Pool", "Lazy River", "Body Slides", "Go-Karts", "Zip Line", "Rock Climbing", "50+ Attractions"]
  }
];

const ParkGrid = ({ onBook }) => {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAboutPark, setSelectedAboutPark] = useState(null);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/parks');
        if (data && data.length > 0) {
          const sorted = data.sort((a, b) => {
            if (a.name.toLowerCase().includes('wonderla')) return -1;
            if (b.name.toLowerCase().includes('wonderla')) return 1;
            return 0;
          });
          setParks(sorted);
        } else {
          setParks(fallbackParks);
        }
      } catch (err) {
        console.error("Failed to fetch parks:", err);
        setParks(fallbackParks);
      } finally {
        setLoading(false);
      }
    };
    fetchParks();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <section className="parks-section" id="parks">
      <div className="max-width-wrapper">
        <div className="section-header">
          <p className="section-indicator">EXPLORE PARKS</p>
          <h2 className="section-title text-white-shimmer-rtl">CHOOSE YOUR ADVENTURE</h2>
          <p className="section-subtitle">Pick a park, grab your tickets, and get ready for takeoff!</p>
        </div>

        <div className="parks-grid">
          {parks.map((park, index) => (
            <motion.div 
              key={park.id}
              className="park-card"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <div className="park-image-wrapper" onClick={() => onBook(park)} style={{ cursor: 'pointer' }}>
                <img src={park.image} alt={park.name} className="park-image" />
                <div className="park-rating glass-morphism">
                  <Star size={16} fill="#FFD700" color="#FFD700" />
                  <span>{park.rating}</span>
                </div>
              </div>
              <div className="park-info">
                <div className="park-location">
                  <MapPin size={14} style={{ marginRight: '6px' }} />
                  {park.location}
                </div>
                <h3 className="park-name" onClick={() => onBook(park)} style={{ cursor: 'pointer' }}>{park.name}</h3>
                <p className="park-desc">{park.desc}</p>
                
                {park.tickets_available && (
                  <div className="mission-cap-alert">
                    <div className="pulse-dot"></div>
                    Only <span>{park.tickets_available}</span> Tickets Remaining!
                  </div>
                )}

                <button className="about-park-btn" onClick={() => setSelectedAboutPark(park)}>
                  <Info size={14} style={{ marginRight: '6px' }} />
                  About This Park
                </button>

                <div className="park-footer">
                  <div className="price-block">
                    <span className="price-label">Tickets From</span>
                    <span className="price-amount">₹{park.price}</span>
                  </div>
                  <button className="park-btn" onClick={() => onBook(park)}>
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About Park Modal */}
      {selectedAboutPark && (
        <div className="about-modal-overlay animate-fade-in" onClick={() => setSelectedAboutPark(null)}>
          <motion.div 
            className="about-modal-content glass-morphism" 
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <button className="about-modal-close" onClick={() => setSelectedAboutPark(null)}>
              <X size={24} />
            </button>
            
            <div className="about-modal-header">
              <h2 className="text-white-shimmer-rtl">{selectedAboutPark.name}</h2>
              <div className="park-location" style={{ marginTop: '5px' }}>
                <MapPin size={14} style={{ marginRight: '6px' }} />
                {selectedAboutPark.location}
              </div>
            </div>

            <div className="about-modal-body">
              <section className="about-section">
                <h4 className="section-label">ABOUT</h4>
                <p className="about-text">{selectedAboutPark.about || selectedAboutPark.desc}</p>
              </section>

              <section className="about-features-section">
                <h4 className="section-label">RIDES & FEATURES</h4>
                <div className="features-badges">
                  {(selectedAboutPark.features || []).map((feature, i) => (
                    <span key={i} className="feature-badge">{feature}</span>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};

export default ParkGrid;
