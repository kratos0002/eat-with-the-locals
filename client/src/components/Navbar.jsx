import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          🌍 Eat with the Locals
        </Link>
        <ul className="navbar-menu">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/submit">Submit Recipe</Link>
          </li>
          <li>
            <Link to="/favorites">My Favorites</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 