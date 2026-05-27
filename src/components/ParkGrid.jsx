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
          // Merge: keep all DB parks, then append any fallback parks whose name
          // doesn't yet exist in the DB so they are never lost when admin saves one park.
          const dbNames = new Set(data.map(p => p.name.toLowerCase()));
          const missingFallbacks = fallbackParks.filter(
            fp => !dbNames.has(fp.name.toLowerCase())
          );
          const merged = [...data, ...missingFallbacks];

          // Always keep Wonderla first
          merged.sort((a, b) => {
            if (a.name.toLowerCase().includes('wonderla')) return -1;
            if (b.name.toLowerCase().includes('wonderla')) return 1;
            return 0;
          });
          setParks(merged);
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
              key={park._id || park.id || index}
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
        const parkName = selectedAboutPark.name?.toLowerCase() || '';
        const isWonderla = parkName.includes('wonderla');
        const isVGP = parkName.includes('vgp');
        const isMGM = parkName.includes('mgm');
        const isQueensLand = parkName.includes('queens');
        const isBlackThunder = parkName.includes('black thunder');
        const isDetailed = isWonderla || isVGP || isMGM || isQueensLand || isBlackThunder;

        const renderDetailedContent = () => {
          if (isWonderla) {
            return (
              <>
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
              </>
            );
          }

          if (isVGP) {
            return (
              <>
                <section className="about-section">
                  <h4 className="section-label">ABOUT</h4>
                  <p className="about-text">
                    VGP Universal Kingdom is India's first and oldest amusement park, established in 1981 by V.G. Panneerdas on Chennai's East Coast Road. Spread across 45+ acres on the Bay of Bengal coastline, the park features an Aqua Kingdom water zone, a private beach on the Bay of Bengal, a Pet Zoo, live entertainment shows, and arcade gaming zones including Cyber Kingdom and Waghoba Premium Social Gaming. A beloved landmark for Tamil Nadu families for over four decades.
                  </p>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK TIMINGS</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">🗓️ <strong>All Days (Mon–Sun):</strong> 9:30 AM – 6:00 PM</li>
                    <li className="wonderla-timing-item">✨ Open all days of the year</li>
                  </ul>
                  <span className="wonderla-note">* Timings may vary on special occasions. Check official site before visiting.</span>
                </section>

                <section className="about-section">
                  <h4 className="section-label">TICKET PRICES</h4>
                  <table className="wonderla-pricing-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Adult Fun Pass</strong></td>
                        <td>₹829</td>
                      </tr>
                      <tr>
                        <td><strong>Child Fun Pass (90cm–130cm height)</strong></td>
                        <td>₹649</td>
                      </tr>
                      <tr>
                        <td><strong>Senior Citizen Pass</strong></td>
                        <td>₹649</td>
                      </tr>
                      <tr>
                        <td><strong>College Student Pass</strong></td>
                        <td>₹780</td>
                      </tr>
                      <tr>
                        <td><strong>Double Fun Pass Adult (VGP + Marine Kingdom)</strong></td>
                        <td>₹1,313</td>
                      </tr>
                      <tr>
                        <td><strong>Double Fun Pass Child (VGP + Marine Kingdom)</strong></td>
                        <td>₹1,128</td>
                      </tr>
                      <tr>
                        <td><strong>Child below 90cm</strong></td>
                        <td style={{ color: '#6BCB77', fontWeight: 'bold' }}>FREE</td>
                      </tr>
                    </tbody>
                  </table>
                  <span className="wonderla-note">
                    * Early bird 15% OFF — not applicable for same-day booking. Prices inclusive of all taxes. No cancellation or postponement after booking.
                  </span>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">STAR RIDES</h4>
                  <div className="features-badges">
                    {["🌊 Aqua Kingdom Water Zone", "🏖️ Private Beach — Bay of Bengal", "🎡 Giant Wheel", "🎢 Roller Coaster", "🎠 Carousel", "🐾 Pet Zoo", "🎭 Live Entertainment Shows", "🕹️ Cyber Kingdom Arcade", "🎮 Waghoba Social Gaming", "🎯 Carnival Games", "💫 Kids Zone"].map((badge, i) => (
                      <span key={i} className="feature-badge" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>{badge}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK RULES</h4>
                  <ul className="wonderla-rules-list">
                    <li className="wonderla-rule-item">🚫 Outside food and eatables strictly not allowed</li>
                    <li className="wonderla-rule-item">📏 Child ticket for 90cm–130cm height only</li>
                    <li className="wonderla-rule-item">👶 Children below 90cm enter FREE</li>
                    <li className="wonderla-rule-item">🎓 College students must show current-year ID</li>
                    <li className="wonderla-rule-item">🚫 No cancellation or postponement after booking</li>
                    <li className="wonderla-rule-item">⚠️ Entry denied for violation of park rules</li>
                    <li className="wonderla-rule-item">🏊 Swimwear required for water attractions</li>
                    <li className="wonderla-rule-item">♿ Accessibility support available on request</li>
                  </ul>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">FACILITIES</h4>
                  <div className="features-badges">
                    {["Aqua Kingdom", "Private Beach", "Pet Zoo", "Live Shows Stage", "Cyber Kingdom Arcade", "Waghoba Gaming Zone", "Food Courts", "Veg Meal ₹250", "Non-veg Meal ₹300", "Parking Available"].map((facility, i) => (
                      <span key={i} className="feature-badge" style={{ background: 'rgba(0, 209, 255, 0.05)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.1)' }}>{facility}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GOOD TO KNOW</h4>
                  <ul className="wonderla-good-list">
                    <li className="wonderla-good-item">✅ One ticket = Unlimited rides all day</li>
                    <li className="wonderla-good-item">✅ Early bird 15% off — book in advance</li>
                    <li className="wonderla-good-item">✅ Double Fun Pass covers VGP + Marine Kingdom</li>
                    <li className="wonderla-good-item">✅ ₹150 game credits for Cyber Kingdom included</li>
                    <li className="wonderla-good-item">✅ ₹250 game credits for Waghoba Gaming included</li>
                    <li className="wonderla-good-item">✅ Group bookings available — contact park directly</li>
                    <li className="wonderla-good-item">✅ Private beach access included in all tickets</li>
                    <li className="wonderla-good-item">✅ Live globe-trotting entertainment shows daily</li>
                  </ul>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GETTING THERE</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">📍 East Coast Road (ECR), Chennai</li>
                    <li className="wonderla-timing-item">📞 +91 89397 00588</li>
                    <li className="wonderla-timing-item">📧 info@vgpuniversalkingdom.com</li>
                  </ul>
                </section>
              </>
            );
          }

          if (isMGM) {
            return (
              <>
                <section className="about-section">
                  <h4 className="section-label">ABOUT</h4>
                  <p className="about-text">
                    MGM Dizzee World is one of India's largest and oldest amusement parks, established in 1993 along the scenic East Coast Road at Muthukadu, Chennai. Designed by Italian architects, the park spans over 60 acres and welcomes over a million visitors annually. It offers adrenaline-pumping adult rides, family rides, children's rides, a dedicated water park, a 5D Theatre, Mirror Maze, Upside Down House, Vortex, Devil House, Segway tours, and carnival games — all set against a stunning coastal backdrop.
                  </p>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK TIMINGS</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">🗓️ <strong>Monday to Friday:</strong> 10:30 AM – 6:00 PM</li>
                    <li className="wonderla-timing-item">🎉 <strong>Saturday, Sunday & Public Holidays:</strong> 10:30 AM – 6:30 PM</li>
                    <li className="wonderla-timing-item">✨ Open on all public and government holidays</li>
                  </ul>
                  <span className="wonderla-note">* Some outdoor rides may be non-operational during heavy rains.</span>
                </section>

                <section className="about-section">
                  <h4 className="section-label">TICKET PRICES</h4>
                  <table className="wonderla-pricing-table">
                    <thead>
                      <tr>
                        <th>Package</th>
                        <th>Adult</th>
                        <th>Child</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Jumbo Package</strong></td>
                        <td>₹1,179</td>
                        <td>₹825</td>
                      </tr>
                      <tr>
                        <td><strong>Mega Fun Package</strong></td>
                        <td>₹1,415</td>
                        <td>₹1,179</td>
                      </tr>
                      <tr>
                        <td><strong>Priority Pass</strong></td>
                        <td>₹2,359</td>
                        <td>₹1,769</td>
                      </tr>
                    </tbody>
                  </table>
                  <span className="wonderla-note">
                    * Adult: height above 4'4" | Child: 2'6" to 4'4" height. All prices inclusive of 18% GST. 20% off for college students with valid ID. Group discount for 25+ visitors.
                  </span>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">STAR RIDES</h4>
                  <div className="features-badges">
                    {["🎢 Rolling Thunder Coaster", "🌈 Rainbow Coaster", "🎡 Giant Wheel", "💧 Water Park & Slides", "🌊 Wave Pool", "🌊 Chinna Kutralam Falls", "🎭 5D Theatre", "🪞 Mirror Maze", "🏠 Upside Down House", "🌀 Vortex", "😈 Devil House", "🛴 Segway Tours", "🎯 Carnival Games", "🎠 Kids Zone", "🎪 World-class Amphitheatre"].map((badge, i) => (
                      <span key={i} className="feature-badge" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>{badge}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK RULES</h4>
                  <ul className="wonderla-rules-list">
                    <li className="wonderla-rule-item">🚫 Outside food allowed (unlike other parks)</li>
                    <li className="wonderla-rule-item">👙 Proper swimwear required for water park</li>
                    <li className="wonderla-rule-item">📏 Ride restrictions based on height/weight (displayed at each ride entrance)</li>
                    <li className="wonderla-rule-item">🎓 College students get 20% off with valid ID</li>
                    <li className="wonderla-rule-item">👥 Group discount available for 25+ visitors</li>
                    <li className="wonderla-rule-item">🌧️ Some rides may close during heavy rains</li>
                    <li className="wonderla-rule-item">🍽️ Multiple restaurants inside — no need to carry food</li>
                    <li className="wonderla-rule-item">🏨 MGM Beach Resort available for overnight stay</li>
                  </ul>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">FACILITIES</h4>
                  <div className="features-badges">
                    {["Surfin Food Court (Veg)", "Dizzee Den Food Court (Non-Veg)", "Five Feet Dosa at Fortellow", "MGM Beach Resort", "Banquet Lawn", "Amphitheatre", "Segway Zone", "5D Theatre", "Carnival Games", "Parking Available", "Group Event Hosting"].map((facility, i) => (
                      <span key={i} className="feature-badge" style={{ background: 'rgba(0, 209, 255, 0.05)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.1)' }}>{facility}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GOOD TO KNOW</h4>
                  <ul className="wonderla-good-list">
                    <li className="wonderla-good-item">✅ Outside food and drinks permitted</li>
                    <li className="wonderla-good-item">✅ Online booking available via Razorpay</li>
                    <li className="wonderla-good-item">✅ Jumbo, Mega Fun & Priority Pass packages</li>
                    <li className="wonderla-good-item">✅ 20% off for college students with ID</li>
                    <li className="wonderla-good-item">✅ 20% off for groups of 25 or more</li>
                    <li className="wonderla-good-item">✅ Banquet lawn for evening events (6:30 PM – 10:30 PM)</li>
                    <li className="wonderla-good-item">✅ Stay option: MGM Beach Resort on-site</li>
                    <li className="wonderla-good-item">✅ Open year-round including all holidays</li>
                  </ul>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GETTING THERE</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">📍 1/74, SH 49, Muthukadu, Chennai, Tamil Nadu – 600112</li>
                    <li className="wonderla-timing-item">📞 +91 95000 63716 / +91 80697 95555</li>
                    <li className="wonderla-timing-item">📧 sales@mgmdizzeeworld.com</li>
                  </ul>
                </section>
              </>
            );
          }

          if (isQueensLand) {
            return (
              <>
                <section className="about-section">
                  <h4 className="section-label">ABOUT</h4>
                  <p className="about-text">
                    Queensland Amusement Park is one of Tamil Nadu's largest and most loved theme parks, located on the Chennai–Bangalore Trunk Road in Sembarambakkam, Palanjur. A unit of Rajam Hotels Pvt Ltd, the park features 50+ attractions across thrill rides, kids rides, and water rides. Its newest addition — the spectacular Niagara Falls attraction — has become a must-visit highlight. Known for affordable pricing, excellent maintenance, and a clean, safe environment, Queensland is ideal for family outings, school trips, and corporate events.
                  </p>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK TIMINGS</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">🗓️ <strong>Monday to Sunday:</strong> 11:00 AM – 7:00 PM</li>
                    <li className="wonderla-timing-item">✨ Open all days of the year</li>
                  </ul>
                </section>

                <section className="about-section">
                  <h4 className="section-label">TICKET PRICES</h4>
                  <table className="wonderla-pricing-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Adult</strong></td>
                        <td>₹1,299</td>
                      </tr>
                      <tr>
                        <td><strong>Kids (2.5ft–4.5ft)</strong></td>
                        <td>₹999</td>
                      </tr>
                      <tr>
                        <td><strong>Senior Citizen</strong></td>
                        <td>₹899</td>
                      </tr>
                      <tr>
                        <td><strong>Defence Personnel</strong></td>
                        <td>₹899</td>
                      </tr>
                      <tr>
                        <td><strong>Child below 2.5ft</strong></td>
                        <td style={{ color: '#6BCB77', fontWeight: 'bold' }}>FREE</td>
                      </tr>
                    </tbody>
                  </table>
                  <span className="wonderla-note">
                    * Prices effective from 1st January 2026. Parking fees not included. All ticket sales are final — no cancellation or exchange. Tickets available online and at ticket booth.
                  </span>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">STAR RIDES</h4>
                  <div className="features-badges">
                    {["🌊 Niagara Falls Attraction (NEW)", "🎢 Free Fall Tower", "🐙 Octopus Ride", "🎡 Giant Wheel", "🎠 Trampoline Delight", "💧 Water Rides Zone", "🏊 Swimming Area", "🌀 Thrill Rides", "👶 Kids Rides Zone", "🚗 Bumper Cars", "🎯 Carnival Stalls", "🏖️ Courtalam-style Falls Experience"].map((badge, i) => (
                      <span key={i} className="feature-badge" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>{badge}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK RULES</h4>
                  <ul className="wonderla-rules-list">
                    <li className="wonderla-rule-item">🚫 Outside food and drinks not allowed inside</li>
                    <li className="wonderla-rule-item">🎫 All ticket sales are final — no refunds</li>
                    <li className="wonderla-rule-item">🅿️ Parking fees are separate (not in ticket)</li>
                    <li className="wonderla-rule-item">📸 Commercial photo/video requires permission</li>
                    <li className="wonderla-rule-item">♿ Wheelchairs available for visitors who need</li>
                    <li className="wonderla-rule-item">👶 Kids below 2.5ft enter FREE</li>
                    <li className="wonderla-rule-item">🔒 Lockers and storage available</li>
                    <li className="wonderla-rule-item">🏥 First aid available inside the park</li>
                  </ul>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">FACILITIES</h4>
                  <div className="features-badges">
                    {["Food Stalls", "Restaurants", "Event Spaces", "Group Booking Facility", "Wheelchair Access", "Parking (Paid)", "Online Booking", "Ticket Booth", "Niagara Falls Zone", "Swimming Area"].map((facility, i) => (
                      <span key={i} className="feature-badge" style={{ background: 'rgba(0, 209, 255, 0.05)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.1)' }}>{facility}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GOOD TO KNOW</h4>
                  <ul className="wonderla-good-list">
                    <li className="wonderla-good-item">✅ 50+ rides and attractions across 3 zones</li>
                    <li className="wonderla-good-item">✅ Niagara Falls — newest must-try attraction</li>
                    <li className="wonderla-good-item">✅ Affordable pricing vs other Chennai parks</li>
                    <li className="wonderla-good-item">✅ 4.0 rating on Google with 29,000+ reviews</li>
                    <li className="wonderla-good-item">✅ Excellent for school trips & corporate days</li>
                    <li className="wonderla-good-item">✅ Group booking discounts available</li>
                    <li className="wonderla-good-item">✅ Wheelchair support for differently-abled</li>
                    <li className="wonderla-good-item">✅ Very near Vandalur Zoo — plan a combo trip</li>
                  </ul>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GETTING THERE</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">📍 Chennai–Bangalore Trunk Road, Palanjur, Sembarambakkam, Chennai – 600 123</li>
                    <li className="wonderla-timing-item">📞 044-2681 1124 / 044-2681 1136 / +91 94443 94706</li>
                    <li className="wonderla-timing-item">📧 info@queenslandamusementpark.com</li>
                  </ul>
                </section>
              </>
            );
          }

          if (isBlackThunder) {
            return (
              <>
                <section className="about-section">
                  <h4 className="section-label">ABOUT</h4>
                  <p className="about-text">
                    Black Thunder is Asia's No. 1 Water Theme Park, nestled in the scenic foothills of the Nilgiri Hills at Mettupalayam, on the highway to Ooty. Established in 1997, the park spans a vast area offering 50+ water rides, dry rides, adventure activities, lakeside attractions, dining, and the AVANA Resort for overnight stays. Rated the grandest water theme park in India, Black Thunder promises unlimited fun and adventure with the breathtaking Western Ghats as a backdrop — making it a truly unique destination unlike any other.
                  </p>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK TIMINGS</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">🗓️ <strong>All Days:</strong> Morning – Evening (contact park for exact hours)</li>
                    <li className="wonderla-timing-item">✨ Open year-round</li>
                    <li className="wonderla-timing-item">🧗 Adventure combo activities available during park hours</li>
                  </ul>
                  <span className="wonderla-note">* Timings may vary by season. Call +91 98944 59115 to confirm before visiting.</span>
                </section>

                <section className="about-section">
                  <h4 className="section-label">TICKET PRICES</h4>
                  <table className="wonderla-pricing-table">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Adult</strong></td>
                        <td>₹1,090</td>
                      </tr>
                      <tr>
                        <td><strong>Child (85cm–140cm)</strong></td>
                        <td>₹850</td>
                      </tr>
                      <tr>
                        <td><strong>College Student</strong></td>
                        <td>₹890</td>
                      </tr>
                      <tr>
                        <td><strong>School Student</strong></td>
                        <td>₹790</td>
                      </tr>
                      <tr>
                        <td><strong>Senior Citizen / Defence</strong></td>
                        <td>₹850</td>
                      </tr>
                      <tr>
                        <td><strong>Special Combo Ticket (Park Entry + Adventure)</strong></td>
                        <td>₹1,450</td>
                      </tr>
                      <tr>
                        <td><strong>Adventure Activities Only</strong></td>
                        <td>₹550</td>
                      </tr>
                      <tr>
                        <td><strong>Child below 85cm</strong></td>
                        <td style={{ color: '#6BCB77', fontWeight: 'bold' }}>FREE</td>
                      </tr>
                    </tbody>
                  </table>
                  <span className="wonderla-note">
                    * Special Combo & Adventure: min height 145cm, max weight 85kg. School/college groups of 20+ with bonafide letter get concession. 1 free staff entry per 15 students. (Prices effective 1st March 2026)
                  </span>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">STAR RIDES</h4>
                  <div className="features-badges">
                    {["🌊 Water Slides (50+ rides)", "🕳️ Black Hole Slide", "🌀 Kamikaze", "🌪️ Tornado Slide", "🏊 Wave Pool", "🛶 Lazy River", "⛵ Lake Rides / Boating", "🏋️ Wall Climbing", "🚴 Zip Cycle", "🎢 Dry Rides Zone", "🎠 Kids Playstation", "🧗 Adventure Combo Activities", "🏨 AVANA Resort Stay", "🍽️ Tusker Bar & Dining", "🦁 Lucky Ariel Water Feature"].map((badge, i) => (
                      <span key={i} className="feature-badge" style={{ fontSize: '12px', background: 'rgba(255,255,255,0.04)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>{badge}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">PARK RULES</h4>
                  <ul className="wonderla-rules-list">
                    <li className="wonderla-rule-item">📏 Child ticket: 85cm–140cm height only</li>
                    <li className="wonderla-rule-item">👶 Children below 85cm enter FREE</li>
                    <li className="wonderla-rule-item">🎓 School/college groups need bonafide letter</li>
                    <li className="wonderla-rule-item">⚖️ Adventure activities: max weight 85kg, min height 145cm</li>
                    <li className="wonderla-rule-item">🪪 Senior citizens & defence must show ID proof</li>
                    <li className="wonderla-rule-item">🚫 No outside food for general visitors (group food arrangements available)</li>
                    <li className="wonderla-rule-item">🏊 Proper swimwear required for water rides</li>
                    <li className="wonderla-rule-item">🛡️ All rides follow international safety norms</li>
                  </ul>
                </section>

                <section className="about-features-section">
                  <h4 className="section-label">FACILITIES</h4>
                  <div className="features-badges">
                    {["50+ Water Rides", "Dry Rides Zone", "Lake Rides & Boating", "Zip Cycle", "Wall Climbing", "Kids Playstation", "Tusker Bar", "Multiple Restaurants", "AVANA Resort (On-site)", "Banquet & Weddings", "Adventure Combo Zone", "Parking Available"].map((facility, i) => (
                      <span key={i} className="feature-badge" style={{ background: 'rgba(0, 209, 255, 0.05)', color: '#00D1FF', border: '1px solid rgba(0, 209, 255, 0.1)' }}>{facility}</span>
                    ))}
                  </div>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GOOD TO KNOW</h4>
                  <ul className="wonderla-good-list">
                    <li className="wonderla-good-item">✅ Asia's No.1 Water Theme Park rating</li>
                    <li className="wonderla-good-item">✅ Special Combo: park entry + adventure zone</li>
                    <li className="wonderla-good-item">✅ AVANA Resort for overnight stay packages</li>
                    <li className="wonderla-good-item">✅ Wedding & banquet facilities available</li>
                    <li className="wonderla-good-item">✅ Group food arrangements for school/corporate</li>
                    <li className="wonderla-good-item">✅ 1 free staff entry per 15 students</li>
                    <li className="wonderla-good-item">✅ Best price guaranteed on direct booking</li>
                    <li className="wonderla-good-item">✅ Early bird online offer: book 20+ tickets for 20% discount</li>
                  </ul>
                </section>

                <section className="about-section">
                  <h4 className="section-label">GETTING THERE</h4>
                  <ul className="wonderla-timing-list">
                    <li className="wonderla-timing-item">📍 Jaganari Slopes R.F., Mettupalayam, Tamil Nadu – 641305 (On the highway to Ooty)</li>
                    <li className="wonderla-timing-item">📞 +91 98944 59115 (Reservations) / +91 98947 26640 (Resort)</li>
                    <li className="wonderla-timing-item">📧 info@blackthunder.in</li>
                  </ul>
                </section>
              </>
            );
          }

          return null;
        };

        return (
          <div className="about-modal-overlay animate-fade-in" onClick={() => setSelectedAboutPark(null)}>
            <motion.div 
              className={`about-modal-content glass-morphism ${isDetailed ? 'wonderla-modal-wide' : ''}`}
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
                {isDetailed ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                      {renderDetailedContent()}
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
