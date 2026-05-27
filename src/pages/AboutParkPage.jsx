import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { fallbackParks, getSlug } from '../utils/parksData';
import '../components/ParkGrid.css';
import './AboutParkPage.css';

const AboutParkPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [seniors, setSeniors] = useState(0);
  const [students, setStudents] = useState(0);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/parks');
        if (data && data.length > 0) {
          const found = data.find(p => getSlug(p.name) === slug);
          if (found) {
            setPark(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {}
      
      const fallback = fallbackParks.find(p => getSlug(p.name) === slug);
      setPark(fallback);
      setLoading(false);
    };
    fetchParks();
  }, [slug]);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  }

  if (!park) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Park not found.</div>;
  }

  const parkName = park.name?.toLowerCase() || '';
  const isWonderla = parkName.includes('wonderla');
  const isVGP = parkName.includes('vgp');
  const isMGM = parkName.includes('mgm');
  const isQueensLand = parkName.includes('queens');
  const isBlackThunder = parkName.includes('black thunder');
  const isDetailed = isWonderla || isVGP || isMGM || isQueensLand || isBlackThunder;

  // Re-enable this by injecting selectedAboutPark as park to make the old code work
  const selectedAboutPark = park;

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

        

  
  const price = park.adultPrice || parseInt(park.price) || 1489;
  const childPrice = park.kidsPrice || parseInt(park.price * 0.75) || 1191;
  const total = (adults * price) + (children * childPrice) + (seniors * 946) + (students * price * 0.8);

  return (
    <div className="about-page-wrapper">
      <div className="about-banner">
        <div className="about-banner-inner">
          <button 
            onClick={() => window.history.length > 1 ? window.history.back() : navigate('/#parks')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', marginBottom: '16px', fontSize: '13px', fontWeight: 'bold' }}
          >
            <ArrowLeft size={14} /> Back to Parks
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <h1 className="about-park-name">{park.name}</h1>
            {park.rating && (
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', color: '#FCD34D', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⭐ {park.rating}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', color: '#00D1FF', marginTop: '4px', fontSize: '14px', fontWeight: 600 }}>
            <MapPin size={16} style={{ marginRight: '6px' }} />
            {park.location}
          </div>
        </div>
      </div>

      <div className="about-content-area">
        <div className="about-left-col">
          {renderDetailedContent()}
        </div>

        <div className="about-right-col">
          <div className="sticky-booking-card">
            <p style={{ fontSize: '11px', color: '#888', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', margin: '0 0 4px' }}>TICKETS FROM</p>
            <div style={{ margin: '0 0 4px' }}>
              <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#CCFF00' }}>₹{price}</span>
              <span style={{ fontSize: '12px', color: '#888', verticalAlign: 'middle', marginLeft: '6px' }}>/ADULT</span>
            </div>

            <div>
              <p style={{ marginTop: '20px', fontSize: '11px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>Visit Date</p>
              <input type="date" style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} min={new Date().toISOString().split('T')[0]} defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
              {[
                { label: 'Adults', val: adults, setter: setAdults, min: 1 },
                { label: 'Children', val: children, setter: setChildren, min: 0 },
                { label: 'Sr. Citizen', val: seniors, setter: setSeniors, min: 0 },
                { label: 'Students', val: students, setter: setStudents, min: 0 }
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #1a1a2a' }}>
                  <span style={{ fontSize: '13px', color: '#ccc' }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => row.setter(Math.max(row.min, row.val - 1))} style={{ width: '28px', height: '28px', background: '#1a1a2a', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                    <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', minWidth: '16px', textAlign: 'center' }}>{row.val}</span>
                    <button onClick={() => row.setter(row.val + 1)} style={{ width: '28px', height: '28px', background: '#1a1a2a', border: 'none', borderRadius: '6px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '16px', color: '#fff', fontWeight: 700 }}>Total:</span>
              <span style={{ fontSize: '16px', color: '#CCFF00', fontWeight: 700 }}>₹{total.toLocaleString()}</span>
            </div>

            <button 
              onClick={() => navigate('/book/' + slug)}
              style={{ marginTop: '16px', width: '100%', height: '48px', background: '#CCFF00', color: '#0a0a14', fontWeight: 800, fontSize: '14px', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
            >
              BOOK NOW →
            </button>

            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '11px', color: '#666' }}>✅ WhatsApp ticket delivery</div>
              <div style={{ fontSize: '11px', color: '#666' }}>✅ Verified booking</div>
              <div style={{ fontSize: '11px', color: '#666' }}>✅ 2–4 hr delivery</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Bar */}
      <div className="mobile-bottom-bar">
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>From <span style={{ color: '#CCFF00' }}>₹{price}</span></span>
        <button 
          onClick={() => navigate('/book/' + slug)}
          style={{ background: '#CCFF00', color: '#0a0a14', fontWeight: 800, fontSize: '14px', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer' }}
        >
          BOOK NOW →
        </button>
      </div>
    </div>
  );
};

export default AboutParkPage;
