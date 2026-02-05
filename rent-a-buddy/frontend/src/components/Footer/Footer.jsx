// components/Footer/Footer.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Footer.scss';

const Footer = ({light = false}) => {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: 'About', path: '/about' },
    { name: 'Safety', path: '/safety' },
    { name: 'Help', path: '/help' },
    { name: 'Terms', path: '/terms' },
    { name: 'Privacy', path: '/privacy' },
    // { name: 'Become Buddy', path: '/become-buddy' }
  ];

  return (
    <footer className={`footer ${light ? 'light-theme' : ''}`}>
      <div className="footer-container">
        {/* Logo */}
        <div className="footer-logo">
          <span className="logo-text">Rent a Buddy</span>
        </div>

        {/* Links */}
        <div className="footer-links">
          {links.map((link, index) => (
            <NavLink 
              key={index} 
              to={link.path} 
              className="footer-link"
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          <span>© {currentYear} Rent a Buddy. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;