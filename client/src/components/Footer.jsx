import './Footer.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} Eat with the Locals. All rights reserved.</p>
        <p>Discover and share recipes from around the world</p>
      </div>
    </footer>
  );
}

export default Footer; 