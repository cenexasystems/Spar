import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight } from 'lucide-react';
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
    features: ["Rewind Ride", "Equinox", "Rain Disco", "Wave Pool", "Turbo Tunnel", "4D Theatre", "Go-Karting", "Lazy River", "Flash Tower"]
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
    features: ["Giant Wheel", "Roller Coaster", "Pirate Ship", "Snow Park", "Private Beach", "Wave Pool", "Haunted House", "Live Shows", "Bumper Cars"]
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
    features: ["Dizzee Castle", "Drop Zone", "Forest Water Park", "Wave Pool", "Speed Slides", "Tagada", "Kids Zone", "Ocean View", "Food Village"]
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
    features: ["Cable Car", "Columbus", "Giant Wheel", "Wave Pool", "Rain Dance", "Roller Coaster", "Splash Pad", "51 Rides", "Toddler Zone"]
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
    features: ["Black Hole Slide", "Kamikaze", "Tornado", "Wave Pool", "Lazy River", "Zip Line", "Go-Karts", "Rock Climbing", "50+ Attractions"]
  }
];

const ParkGrid = ({ onBook }) => {
  const [parks, setParks] = useState([]);
  const [loading, setLoading] = useState(true);

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
                  <Star size={16} fill="var(--primary-light-green)" color="var(--primary-light-green)" />
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

                <div className="park-features-section">
                  <h4 className="features-title">RIDES & FEATURES</h4>
                  <div className="features-badges">
                    {(park.features || []).map((feature, i) => (
                      <span key={i} className="feature-badge">{feature}</span>
                    ))}
                  </div>
                </div>

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
    </section>
  );
};

export default ParkGrid;
