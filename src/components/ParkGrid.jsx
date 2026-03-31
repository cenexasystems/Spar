import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import './ParkGrid.css';

const fallbackParks = [
  {
    id: 1,
    name: "VGP UNIVERSAL KINGDOM",
    location: "Chennai, Tamil Nadu",
    rating: 4.8,
    price: "1200",
    image: "/vgp-image.jpg",
    desc: "India's first and largest amusement park with over 45 thrilling rides and a private beach."
  },
  {
    id: 2,
    name: "MGM DIZZEE WORLD",
    location: "Chennai, Tamil Nadu",
    rating: 4.6,
    price: "1000",
    image: "/mgm-image.jpg",
    desc: "The Pioneer of entertainment, offering world-class rides and a unique forest-themed water park."
  },
  {
    id: 3,
    name: "QUEENS LAND",
    location: "Poonamallee, Chennai",
    rating: 4.5,
    price: "850",
    image: "/queensland_final.png",
    desc: "An expansive theme park featuring 51 rides, including an enormous cable car and wave pool."
  },
  {
    id: 4,
    name: "BLACK THUNDER",
    location: "Mettupalayam, Coimbatore",
    rating: 4.7,
    price: "950",
    image: "/black_thunder_final.jpg",
    desc: "Asia's No.1 water theme park with the majestic Nilgiris as a backdrop and extreme water slides."
  },
  {
    id: 5,
    name: "WONDERLA",
    location: "Bengaluru, Karnataka",
    rating: 4.9,
    price: "1500",
    image: "/wonderla_final.jpg",
    desc: "The most popular theme park in India featuring world-class high-thrill rides and huge water parks."
  }
];

const ParkGrid = ({ onBook }) => {
  const [parks, setParks] = useState(fallbackParks);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const { data, error } = await supabase.from('parks').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setParks(data);
        }
      } catch (err) {
        console.warn("Supabase Parks fetch failed, using mission presets:", err.message);
      }
    };

    fetchParks();

    // --- REAL-TIME SUBSCRIPTION ---
    const channel = supabase
      .channel('parks-realtime')
      .on('postgres_changes', { event: '*', table: 'parks', schema: 'public' }, (payload) => {
        // Update local state when a change happens
        if (payload.eventType === 'UPDATE') {
          setParks(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        } else {
          fetchParks(); // Refetch for other changes
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section className="parks-section" id="parks">
      <div className="max-width-wrapper">
        <div className="section-header">
          <p className="section-indicator">EXPLORE MISSIONS</p>
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
                    Only <span>{park.tickets_available}</span> Missions Remaining!
                  </div>
                )}

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
