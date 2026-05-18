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
      {selectedAboutPark && (() => {
        const isWonderla = selectedAboutPark.name?.toLowerCase().includes('wonderla');
        return (
          <div className="about-modal-overlay animate-fade-in" onClick={() => setSelectedAboutPark(null)}>
            <motion.div 
              className={`about-modal-content glass-morphism ${isWonderla ? 'wonderla-modal-wide' : ''}`}
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

              <div className="about-modal-body" style={{ paddingBottom: '20px' }}>
                {isWonderla ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      <section className="about-section">
                        <h4 className="section-label">ABOUT</h4>
                        <p className="about-text">
                          Wonderla is India's largest and most-visited amusement park chain, operated by Wonderla Holidays Limited. 
                          Founded in 2000 by Kochouseph Chittilappilly, the brand has grown to 5 parks across India — Kochi, Bengaluru, 
                          Hyderabad, Bhubaneswar, and Chennai. Every Wonderla park combines high-thrill land rides, expansive water 
                          attractions, family zones, and world-class safety standards, making it India's most trusted theme park 
                          experience for over two decades.
                        </p>
                      </section>

                      <section className="about-section">
                        <h4 className="section-label">PARK TIMINGS</h4>
                        <ul className="wonderla-timing-list">
                          <li className="wonderla-timing-item">🗓️ <strong>Weekdays:</strong> 11:00 AM – 6:00 PM</li>
                          <li className="wonderla-timing-item">🎉 <strong>Weekends & Public Holidays:</strong> 11:00 AM – 7:00 PM</li>
                          <li className="wonderla-timing-item">🌊 <strong>Water Rides:</strong> 12:30 PM – 5:00 PM</li>
                          <li className="wonderla-timing-item">✨ Open all days of the year</li>
                        </ul>
                        <span className="wonderla-note">* Timings may vary by location and season. Check official site before visiting.</span>
                      </section>

                      <section className="about-section">
                        <h4 className="section-label">TICKET PRICES</h4>
                        <table className="wonderla-pricing-table">
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th>Regular</th>
                              <th>Fast Track</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Adult</strong></td>
                              <td>₹1,489</td>
                              <td>₹2,019</td>
                            </tr>
                            <tr>
                              <td><strong>Child (85–140cm)</strong></td>
                              <td>₹1,191</td>
                              <td>₹1,615</td>
                            </tr>
                            <tr>
                              <td><strong>Senior Citizen</strong></td>
                              <td>₹946</td>
                              <td>—</td>
                            </tr>
                            <tr>
                              <td><strong>Child (below 85cm)</strong></td>
                              <td style={{ color: '#6BCB77', fontWeight: 'bold' }}>FREE</td>
                              <td style={{ color: '#6BCB77', fontWeight: 'bold' }}>FREE</td>
                            </tr>
                          </tbody>
                        </table>
                        <span className="wonderla-note">
                          * Weekend prices slightly higher. 10% off for online booking. 20% off for college students with valid ID. Prices vary by location. GST applicable.
                        </span>
                      </section>

                      <section className="about-features-section">
                        <h4 className="section-label">STAR RIDES</h4>
                        <div className="features-badges">
                          {["🎢 Roller Coasters", "🌊 Wave Pool", "💫 Rain Disco", "🌀 Tornado Slide", "🛝 Lazy River", "⚡ High Thrill Rides", "🎡 Giant Ferris Wheel", "🎠 Kids Zone", "🚡 Aerial Rides", "🎭 4D Theatre", "🎆 Laser & Light Shows", "🎵 Musical Fountain"].map((badge, i) => (
                            <span key={i} className="feature-badge" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>{badge}</span>
                          ))}
                        </div>
                      </section>

                      <section className="about-section">
                        <h4 className="section-label">PARK RULES</h4>
                        <ul className="wonderla-rules-list">
                          <li className="wonderla-rule-item">🚫 No outside food or beverages allowed</li>
                          <li className="wonderla-rule-item">👙 Proper swimwear mandatory for water rides (no sarees, dupattas, shirts with buttons)</li>
                          <li className="wonderla-rule-item">📏 Height-based restrictions apply at each ride</li>
                          <li className="wonderla-rule-item">👶 Children below 110cm must be with an adult at all times</li>
                          <li className="wonderla-rule-item">🔒 Lockers available for rent</li>
                          <li className="wonderla-rule-item">🚑 First-aid & paramedic stations inside the park</li>
                          <li className="wonderla-rule-item">♿ Wheelchair access & barrier-free pathways available</li>
                          <li className="wonderla-rule-item">📵 No photography on rides</li>
                          <li className="wonderla-rule-item">🧴 Sunscreen recommended before water rides</li>
                          <li className="wonderla-rule-item">🍔 Multiple food courts and restaurants inside</li>
                        </ul>
                      </section>

                      <section className="about-features-section">
                        <h4 className="section-label">FACILITIES</h4>
                        <div className="features-badges">
                          {["Themed Restaurants", "Locker Rooms", "Baby Care Zones", "First Aid Centre", "Changing Rooms", "Wheelchair Access", "Free Parking", "Conference Hall", "Retail Outlets", "RO Treated Pool Water"].map((facility, i) => (
                            <span key={i} className="feature-badge" style={{ background: 'rgba(0, 209, 255, 0.05)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.1)' }}>{facility}</span>
                          ))}
                        </div>
                      </section>

                      <section className="about-section">
                        <h4 className="section-label">GOOD TO KNOW</h4>
                        <ul className="wonderla-good-list">
                          <li className="wonderla-good-item">✅ One ticket = Unlimited rides (no per-ride charges)</li>
                          <li className="wonderla-good-item">✅ Online booking saves 10% on ticket price</li>
                          <li className="wonderla-good-item">✅ Fast Track tickets let you skip ride queues</li>
                          <li className="wonderla-good-item">✅ Group discounts for 10+ visitors</li>
                          <li className="wonderla-good-item">✅ Birthday & student ID special offers available</li>
                          <li className="wonderla-good-item">✅ Water quality tested daily — RO treated pools</li>
                          <li className="wonderla-good-item">✅ Trained lifeguards on all water attractions</li>
                          <li className="wonderla-good-item">✅ In-house ride engineering & daily safety checks</li>
                        </ul>
                      </section>
                    </div>

                    {/* Book Tickets CTA Footer spanning full width */}
                    <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px' }}>
                      <button className="sticky-book-btn" style={{ width: '100%', position: 'static', boxShadow: '0 8px 32px rgba(199, 255, 0, 0.15)' }} onClick={() => {
                        onBook(selectedAboutPark);
                        setSelectedAboutPark(null);
                      }}>
                        BOOK TICKETS →
                      </button>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </motion.div>
          </div>
        );
      })()}
    </section>
  );
};

export default ParkGrid;
