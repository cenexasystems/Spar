const fs = require('fs');

let content = fs.readFileSync('src/components/ParkGrid.jsx', 'utf8');

// Add imports
content = content.replace(
  "import axios from 'axios';",
  "import axios from 'axios';\nimport { useNavigate } from 'react-router-dom';\nimport { fallbackParks, getSlug } from '../utils/parksData';"
);

// Remove local fallbackParks definition
content = content.replace(/const fallbackParks = \[[\s\S]*?\];\n\n/, '');

// Change ParkGrid signature
content = content.replace('const ParkGrid = ({ onBook }) => {', 'const ParkGrid = () => {');

// Add navigate and remove selectedAboutPark
content = content.replace('const [selectedAboutPark, setSelectedAboutPark] = useState(null);', 'const navigate = useNavigate();');

// Replace onBook(park) with navigate('/book/' + getSlug(park.name))
content = content.replace(/onBook\(park\)/g, "navigate('/book/' + getSlug(park.name))");

// Replace setSelectedAboutPark(park) with navigate('/park/' + getSlug(park.name))
content = content.replace(/setSelectedAboutPark\(park\)/g, "navigate('/park/' + getSlug(park.name))");

// Remove everything from {/* About Park Modal */} to the end of the return statement
let modalStart = content.indexOf('{/* About Park Modal */}');
let sectionEnd = content.indexOf('</section>', modalStart);
content = content.substring(0, modalStart) + '    </section>\n  );\n};\n\nexport default ParkGrid;\n';

fs.writeFileSync('src/components/ParkGrid.jsx', content);
