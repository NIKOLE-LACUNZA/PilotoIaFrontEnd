import React, { useState, useRef, useEffect } from 'react';
import './MenuSandwich.css';

const MenuSandwich: React.FC = () => {
  const [abierto, setAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setAbierto(!abierto);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };

    if (abierto) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [abierto]);

  return (
    <div className="menu-container" ref={menuRef}>
      <div className="menu-icon" onClick={toggleMenu}>
        ☰
      </div>
      {abierto && (
        <ul className="menu-links">
          <li><a href="/">Piloto IA</a></li>
          <li><a href="/documentos">Documentos</a></li>
        </ul>
      )}
    </div>
  );
};

export default MenuSandwich;
