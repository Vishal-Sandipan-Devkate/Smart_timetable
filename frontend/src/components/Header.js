import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isHidden, setIsHidden] = useState(false);
  const [hideMode, setHideMode] = useState('slide'); // 'slide', 'fade', 'collapse', 'minimize'

  // Optional: Remember user preference
  useEffect(() => {
    const savedMode = localStorage.getItem('headerHideMode');
    const savedState = localStorage.getItem('headerHidden') === 'true';
    
    if (savedMode) setHideMode(savedMode);
    setIsHidden(savedState);
  }, []);

  const toggleHeader = () => {
    const newState = !isHidden;
    setIsHidden(newState);
    localStorage.setItem('headerHidden', newState.toString());
  };

  const handleModeChange = (newMode) => {
    setHideMode(newMode);
    localStorage.setItem('headerHideMode', newMode);
  };

  const getHeaderClass = () => {
    if (!isHidden) return '';
    
    switch (hideMode) {
      case 'slide':
        return 'slide-hidden';
      case 'fade':
        return 'fade-hidden';
      case 'collapse':
        return 'collapse-hidden';
      case 'minimize':
        return 'minimize-hidden';
      default:
        return 'slide-hidden';
    }
  };

  // Keyboard shortcut to toggle header
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        toggleHeader();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isHidden]);

  return (
    <>
      
      {/* Hide mode selector */}
      <div className="hide-mode-selector"
          value={"minimize"} 
          onChange={(e) => handleModeChange(e.target.value)}
          >
      </div>

      <header className={`App-header ${getHeaderClass()}`}>
        {/* Integrated hide button */}
        <button 
          className="header-hide-btn" 
          onClick={toggleHeader}
        >
          {isHidden ? 'Show' : 'Hide'}
        </button>

        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="nav-icon">📅</span>
              Timetable Scheduler
            </h1>
            <p className="app-subtitle">Manage your academic schedule efficiently</p>
          </div>

          <nav className="nav-menu">
            <div className="nav-group">
              <span className="nav-group-title">Faculty Management</span>
              <Link to="/faculties" className="nav-link">
                <span className="nav-icon">👥</span>
                View Faculties
              </Link>
              <Link to="/faculties/add" className="nav-link nav-link-primary">
                <span className="nav-icon">➕</span>
                Add Faculty
              </Link>
            </div>

            <div className="nav-divider"></div>

            <div className="nav-group">
              <span className="nav-group-title">Subject Management</span>
              <Link to="/subjects" className="nav-link">
                <span className="nav-icon">📚</span>
                View Subjects
              </Link>
              <Link to="/subjects/add" className="nav-link nav-link-secondary">
                <span className="nav-icon">📝</span>
                Add Subject
              </Link>
            </div>

            <div className="nav-divider"></div>

            <div className="nav-group">
              <span className="nav-group-title">Room Management</span>
              <Link to="/rooms" className="nav-link">
                <span className="nav-icon">🏫</span>
                View Rooms
              </Link>
              <Link to="/rooms/add" className="nav-link nav-link-tertiary">
                <span className="nav-icon">🏗️</span>
                Add Room
              </Link>
            </div>

            <div className="nav-divider"></div>

            <div className="nav-group">
              <span className="nav-group-title">Batch Management</span>
              <Link to="/batches" className="nav-link">
                <span className="nav-icon">👨‍🎓</span>
                View Batches
              </Link>
              <Link to="/batches/add" className="nav-link nav-link-accent">
                <span className="nav-icon">➕</span>
                Add Batch
              </Link>
            </div>

            <div className="nav-divider"></div>

            <div className="nav-group">
              <span className="nav-group-title">Generate Timetable</span>
              <Link to="/generator" className="nav-link">
                <span className="nav-icon">🎯</span>
                Generate Timetable
              </Link>
            </div>
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;