const fs = require('fs');
let content = fs.readFileSync('src/components/BookingModal.jsx', 'utf8');

// Replace props with useParams and fetch
content = content.replace('const BookingModal = ({ isOpen, onClose, selectedPark }) => {', `
import { useParams, useNavigate } from 'react-router-dom';
import { fallbackParks, getSlug } from '../utils/parksData';

const BookingPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selectedPark, setSelectedPark] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParks = async () => {
      try {
        const { data } = await axios.get('http://localhost:5000/api/parks');
        if (data && data.length > 0) {
          const found = data.find(p => getSlug(p.name) === slug);
          if (found) {
            setSelectedPark(found);
            setLoading(false);
            return;
          }
        }
      } catch (err) {}
      
      const fallback = fallbackParks.find(p => getSlug(p.name) === slug);
      setSelectedPark(fallback);
      setLoading(false);
    };
    fetchParks();
  }, [slug]);

  const isOpen = true;
  const onClose = () => { window.history.length > 1 ? window.history.back() : navigate('/#parks'); };

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  if (!selectedPark) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>Park not found.</div>;
`);

// Replace the container classes and add the requested layout styles
content = content.replace('<div className="modal-overlay booking-overlay">', '');
content = content.replace(
  '<div className="modal-container booking-modal-flow glass-morphism solid-dark-bg">', 
  '<div className="booking-modal-flow glass-morphism solid-dark-bg" style={{ maxWidth: "680px", margin: "0 auto", padding: "100px 24px 60px", position: "relative", background: "transparent", boxShadow: "none" }}>'
);

// We need to remove the closing div of modal-overlay.
let lastIndex = content.lastIndexOf('</div>');
if (lastIndex !== -1) {
  content = content.substring(0, lastIndex) + content.substring(lastIndex + 6);
}

// Rename export
content = content.replace('export default BookingModal;', 'export default BookingPage;');

fs.writeFileSync('src/pages/BookingPage.jsx', content);
