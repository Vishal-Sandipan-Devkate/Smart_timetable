import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TimetableDisplay from '../components/TimetableDisplay';
import './GeneratorPage.css';

const GeneratorPage = () => {
  const [timetable, setTimetable] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationStats, setGenerationStats] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');

  // Simulate progress updates during generation
  useEffect(() => {
    if (isLoading) {
      const messages = [
        'Initializing generation...',
        'Loading faculty data...',
        'Processing course requirements...',
        'Optimizing schedule conflicts...',
        'Finalizing timetable...'
      ];
      
      let currentStep = 0;
      const interval = setInterval(() => {
        if (currentStep < messages.length - 1) {
          currentStep++;
          setLoadingMessage(messages[currentStep]);
          setProgress((currentStep / (messages.length - 1)) * 100);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setProgress(0);
      setLoadingMessage('Initializing...');
    }
  }, [isLoading]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    setTimetable(null);
    setGenerationStats(null);
    
    try {
      const startTime = Date.now();
      const response = await axios.post('http://localhost:5000/api/generate');
      const endTime = Date.now();
      
      setTimetable(response.data.schedule);
      
      // Set generation statistics
      setGenerationStats({
        generationTime: Math.round((endTime - startTime) / 1000),
        totalSlots: response.data.schedule?.totalSlots || 0,
        assignedSlots: response.data.schedule?.assignedSlots || 0,
        conflicts: response.data.schedule?.conflicts || 0
      });
      
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTimetable = () => {
    if (timetable) {
      const dataStr = JSON.stringify(timetable, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `timetable-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handlePrintTimetable = () => {
    window.print();
  };

  const clearResults = () => {
    setTimetable(null);
    setError('');
    setGenerationStats(null);
  };

  return (
    <div className="generator-page">
      {/* Header Section */}
      <div className="generator-header">
        <h1 className="generator-title">
          <span className="generator-title-icon">📅</span>
          Generate Timetable
        </h1>
        <p className="generator-subtitle">
          Create an optimized schedule based on your faculty and course requirements
        </p>
        
        <div className="generator-controls">
          <button 
            onClick={handleGenerate} 
            disabled={isLoading}
            className={`generate-button ${isLoading ? 'loading' : ''}`}
          >
            <span className="generate-icon">
              {isLoading ? '⚙️' : '✨'}
            </span>
            {isLoading ? 'Generating...' : 'Generate Timetable'}
          </button>
          
          {(timetable || error) && (
            <button 
              onClick={clearResults}
              className="action-button secondary"
            >
              <span>🔄</span>
              Clear Results
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">{loadingMessage}</p>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          <p className="loading-subtext">This may take a few moments...</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <div className="error-text">
            <div className="error-label">Generation Failed</div>
            {error}
          </div>
        </div>
      )}

      {/* Success Message & Statistics */}
      {timetable && !isLoading && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          <span>Timetable generated successfully!</span>
        </div>
      )}

      {/* Generation Statistics */}
      {generationStats && (
        <div className="generation-stats">
          <div className="stat-item">
            <span className="stat-value">{generationStats.generationTime}s</span>
            <span className="stat-label">Generation Time</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{generationStats.totalSlots}</span>
            <span className="stat-label">Total Slots</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{generationStats.assignedSlots}</span>
            <span className="stat-label">Assigned</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{generationStats.conflicts}</span>
            <span className="stat-label">Conflicts</span>
          </div>
        </div>
      )}

      {/* Timetable Results */}
      {timetable && (
        <div className="timetable-results">
          <div className="results-header">
            <h2 className="results-title">
              <span>📊</span>
              Generated Timetable
            </h2>
            <div className="results-actions">
              <button 
                onClick={handleExportTimetable}
                className="action-button primary"
              >
                <span>💾</span>
                Export JSON
              </button>
              <button 
                onClick={handlePrintTimetable}
                className="action-button"
              >
                
                <span>🖨️</span>
                Print
              </button>
            </div>
          </div>
          
          <TimetableDisplay schedule={timetable} />
        </div>
      )}

      {/* Empty State */}
      {!timetable && !isLoading && !error && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p className="empty-text">
            Click "Generate Timetable" to create your optimized schedule
          </p>
        </div>
      )}
    </div>
    
    
  );
};

export default GeneratorPage;