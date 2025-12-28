
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './FacultyList.css';

const FacultyList = ({ faculties, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [selectedFaculties, setSelectedFaculties] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Enhanced filtering and sorting
  const departments = useMemo(() => 
    [...new Set(faculties.map(faculty => faculty.department))].sort(),
    [faculties]
  );

  const filteredAndSortedFaculties = useMemo(() => {
    let filtered = faculties.filter(faculty => {
      const matchesSearch = 
        faculty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faculty.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (faculty.phone && faculty.phone.includes(searchTerm)) ||
        (faculty.qualifications && faculty.qualifications.some(qual => 
          (typeof qual === 'string' ? qual : qual.name).toLowerCase().includes(searchTerm.toLowerCase())
        ));
      
      const matchesDepartment = filterDepartment === '' || faculty.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });

    // Sort faculties
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'name' || sortBy === 'department' || sortBy === 'email') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [faculties, searchTerm, filterDepartment, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedFaculties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedFaculties = filteredAndSortedFaculties.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterDepartment, sortBy, sortOrder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            document.querySelector('.search-input')?.focus();
            break;
          case 'a':
            e.preventDefault();
            if (selectedFaculties.length === filteredAndSortedFaculties.length) {
              setSelectedFaculties([]);
            } else {
              setSelectedFaculties(filteredAndSortedFaculties.map(f => f._id));
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedFaculties, filteredAndSortedFaculties]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle selection
  const toggleSelectFaculty = (facultyId) => {
    setSelectedFaculties(prev => 
      prev.includes(facultyId) 
        ? prev.filter(id => id !== facultyId)
        : [...prev, facultyId]
    );
  };

  const selectAllFaculties = () => {
    if (selectedFaculties.length === paginatedFaculties.length) {
      setSelectedFaculties([]);
    } else {
      setSelectedFaculties(paginatedFaculties.map(f => f._id));
    }
  };

  // Handle delete
  const handleDeleteClick = (faculty) => {
    setFacultyToDelete(faculty);
    setShowDeleteModal(true);
  };

  const handleBulkDelete = () => {
    if (selectedFaculties.length > 0) {
      setFacultyToDelete({ _id: 'bulk', name: `${selectedFaculties.length} faculty members` });
      setShowDeleteModal(true);
    }
  };

  const confirmDelete = async () => {
    if (facultyToDelete) {
      setLoading(true);
      try {
        if (facultyToDelete._id === 'bulk') {
          // Handle bulk delete
          for (const id of selectedFaculties) {
            await onDelete(id);
          }
          setSelectedFaculties([]);
          showNotification(`Successfully deleted ${selectedFaculties.length} faculty members`);
        } else {
          await onDelete(facultyToDelete._id);
          showNotification(`Successfully deleted ${facultyToDelete.name}`);
        }
      } catch (error) {
        showNotification('Error deleting faculty member(s)', 'error');
      } finally {
        setLoading(false);
        setShowDeleteModal(false);
        setFacultyToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setFacultyToDelete(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterDepartment('');
    setSortBy('name');
    setSortOrder('asc');
    setSelectedFaculties([]);
  };

  // Export functionality
  const exportFaculties = () => {
    const dataToExport = filteredAndSortedFaculties.map(faculty => ({
      Name: faculty.name,
      Department: faculty.department,
      Email: faculty.email,
      Phone: faculty.phone || 'N/A',
      'Max Hours/Week': faculty.maxHoursPerWeek,
      Qualifications: faculty.qualifications?.map(q => typeof q === 'string' ? q : q.name).join(', ') || 'N/A'
    }));
    
    const csv = [
      Object.keys(dataToExport[0]).join(','),
      ...dataToExport.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faculty_list.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('Faculty list exported successfully');
  };

  return (
    <div className="faculty-list-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'success' ? '✅' : '❌'}
          </span>
          <span className="notification-message">{notification.message}</span>
          <button 
            className="notification-close"
            onClick={() => setNotification(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="list-header">
        <div className="header-content">
          <h2 className="list-title">
            <span className="title-icon">👥</span>
            Faculty Members 
            <span className="faculty-count">({filteredAndSortedFaculties.length})</span>
          </h2>
          <p className="list-subtitle">
            Manage your faculty members and their information
            <span className="keyboard-hint">Press Ctrl+F to search, Ctrl+A to select all</span>
          </p>
        </div>

        {/* Enhanced Controls */}
        <div className="controls-section">
          <div className="search-and-filters">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, email, phone, or qualifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="search-clear"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <button 
              className="filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
            >
              <span className="filter-icon">⚙️</span>
              Filters {showFilters ? '▼' : '▶'}
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filter-row">
                <div className="filter-group">
                  <label className="filter-label">Department</label>
                  <select
                    className="filter-select"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Sort By</label>
                  <select
                    className="filter-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="name">Name</option>
                    <option value="department">Department</option>
                    <option value="email">Email</option>
                    <option value="maxHoursPerWeek">Max Hours</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Order</label>
                  <button 
                    className={`sort-toggle ${sortOrder}`}
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? '↑ A-Z' : '↓ Z-A'}
                  </button>
                </div>

                <div className="filter-group">
                  <label className="filter-label">Items per page</label>
                  <select
                    className="filter-select"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value="6">6</option>
                    <option value="12">12</option>
                    <option value="24">24</option>
                    <option value="48">48</option>
                  </select>
                </div>
              </div>

              <div className="filter-actions">
                <button className="btn btn-clear" onClick={clearFilters}>
                  <span className="btn-icon">🧹</span>
                  Clear All
                </button>
                <button className="btn btn-export" onClick={exportFaculties}>
                  <span className="btn-icon">📊</span>
                  Export CSV
                </button>
              </div>
            </div>
          )}

          {/* View Controls */}
          <div className="view-controls">
            <div className="view-mode-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <span className="view-icon">⊞</span>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <span className="view-icon">☰</span>
              </button>
            </div>

            {selectedFaculties.length > 0 && (
              <div className="bulk-actions">
                <span className="selection-count">
                  {selectedFaculties.length} selected
                </span>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={handleBulkDelete}
                >
                  <span className="btn-icon">🗑️</span>
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {faculties.length > 0 && (
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-value">{faculties.length}</span>
              <span className="stat-label">Total Faculty</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{departments.length}</span>
              <span className="stat-label">Departments</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">
                {Math.round(faculties.reduce((sum, f) => sum + f.maxHoursPerWeek, 0) / faculties.length) || 0}
              </span>
              <span className="stat-label">Avg Hours/Week</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{selectedFaculties.length}</span>
              <span className="stat-label">Selected</span>
            </div>
          </div>
        )}
      </div>

      {/* Faculty Display */}
      <div className={`faculty-display ${viewMode}`}>
        {filteredAndSortedFaculties.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              {searchTerm || filterDepartment ? '🔍' : '👥'}
            </span>
            <h3>
              {searchTerm || filterDepartment 
                ? 'No Faculty Members Found' 
                : 'No Faculty Members Yet'
              }
            </h3>
            <p>
              {searchTerm || filterDepartment 
                ? "Try adjusting your search or filter criteria" 
                : "Start by adding your first faculty member to get organized"
              }
            </p>
            {!searchTerm && !filterDepartment && (
              <Link to="/faculties/add" className="btn btn-primary">
                <span className="btn-icon">➕</span>
                Add First Faculty
              </Link>
            )}
            {(searchTerm || filterDepartment) && (
              <button className="btn btn-secondary" onClick={clearFilters}>
                <span className="btn-icon">🧹</span>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
         { /* list header*/}
            {/* Selection Header (for list view) */} 
            {viewMode === 'list' && (
              <div className="list-header-row">
                <div className="bulk-select">
                  <input
                    type="checkbox"
                    checked={selectedFaculties.length === paginatedFaculties.length}
                    onChange={selectAllFaculties}
                    className="bulk-checkbox"
                  />
                </div>
                <div className="sortable-header" onClick={() => handleSort('name')}>
                  Name  {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
                <div className="sortable-header" onClick={() => handleSort('department')}>
                  Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
                <div className="sortable-header" onClick={() => handleSort('email')}>
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
                <div className="sortable-header" onClick={() => handleSort('maxHoursPerWeek')}>
                  Hours {sortBy === 'maxHoursPerWeek' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
                <div className="actions-header">Actions</div>
              </div>
            )}

            {/* Faculty Items */}
            <div className={`faculty-${viewMode}`}>
              {paginatedFaculties.map(faculty => (
                <div 
                  key={faculty._id} 
                  className={`faculty-${viewMode === 'grid' ? 'card' : 'row'} ${
                    selectedFaculties.includes(faculty._id) ? 'selected' : ''
                  }`}
                >
                  {/* Selection checkbox */}
                  <div className="faculty-select">
                    <input
                      type="checkbox"
                      checked={selectedFaculties.includes(faculty._id)}
                      onChange={() => toggleSelectFaculty(faculty._id)}
                      className="faculty-checkbox"
                    />
                  </div>

                  {viewMode === 'grid' ? (
                    // Grid Card Layout
                    <>
                      <div className="card-header">
                        <div className="faculty-avatar">
                          {faculty.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="faculty-basic-info">
                          <h3 className="faculty-name">{faculty.name}</h3>
                          <p className="faculty-department">{faculty.department}</p>
                        </div>
                        <div className="faculty-status">
                          <span className="status-badge active">Active</span>
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <span className="info-icon">📧</span>
                            <div className="info-content">
                              <span className="info-label">Email</span>
                              <span className="info-value">{faculty.email}</span>
                            </div>
                          </div>

                          <div className="info-item">
                            <span className="info-icon">📱</span>
                            <div className="info-content">
                              <span className="info-label">Phone</span>
                              <span className="info-value">{faculty.phone || 'Not provided'}</span>
                            </div>
                          </div>

                          <div className="info-item">
                            <span className="info-icon">⏰</span>
                            <div className="info-content">
                              <span className="info-label">Max Hours/Week</span>
                              <span className="info-value">{faculty.maxHoursPerWeek} hours</span>
                            </div>
                          </div>

                          {faculty.qualifications && faculty.qualifications.length > 0 && (
                            <div className="info-item full-width">
                              <span className="info-icon">🎓</span>
                              <div className="info-content">
                                <span className="info-label">Qualifications</span>
                                <div className="qualifications-tags">
                                  {faculty.qualifications.slice(0, 3).map((qual, index) => (
                                    <span key={index} className="qualification-tag">
                                      {typeof qual === 'object' ? qual.name : qual}
                                    </span>
                                  ))}
                                  {faculty.qualifications.length > 3 && (
                                    <span className="qualification-tag more">
                                      +{faculty.qualifications.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {faculty.unavailability && faculty.unavailability.length > 0 && (
                            <div className="info-item full-width">
                              <span className="info-icon">🚫</span>
                              <div className="info-content">
                                <span className="info-label">Unavailable Times</span>
                                <div className="unavailability-list">
                                  {faculty.unavailability.slice(0, 2).map((time, index) => (
                                    <span key={index} className="unavailability-item">
                                      {time}
                                    </span>
                                  ))}
                                  {faculty.unavailability.length > 2 && (
                                    <span className="unavailability-item more">
                                      +{faculty.unavailability.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="card-actions">
                        <Link 
                          to={`/faculties/edit/${faculty._id}`}
                          className="btn btn-secondary"
                        >
                          <span className="btn-icon">✏️</span>
                          Edit
                        </Link>
                        <button 
                          className="btn btn-danger"
                          onClick={() => handleDeleteClick(faculty)}
                        >
                          <span className="btn-icon">🗑️</span>
                          Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    // List Row Layout
                    <>
                      <div className="faculty-name-cell">
                        <div className="faculty-avatar-sm">
                          {faculty.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="faculty-name">{faculty.name}</span>
                      </div>
                      <div className="faculty-department-cell">{faculty.department}</div>
                      <div className="faculty-email-cell">{faculty.email}</div>
                      <div className="faculty-hours-cell">{faculty.maxHoursPerWeek}h</div>
                      <div className="faculty-actions-cell-row">
                        <Link 
                          to={`/faculties/edit/${faculty._id}`}
                          className="btn btn-secondary btn-sm"
                        >
                          ✏️
                        </Link>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteClick(faculty)}
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  ⏪
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ◀
                </button>
                
                <div className="pagination-info">
                  <span className="current-page">{currentPage}</span>
                  <span className="page-separator">of</span>
                  <span className="total-pages">{totalPages}</span>
                </div>
                
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  ▶
                </button>
                <button 
                  className="pagination-btn"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  ⏩
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {facultyToDelete?._id === 'bulk' ? 'Confirm Bulk Deletion' : 'Confirm Deletion'}
              </h3>
              <span className="modal-icon">⚠️</span>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{facultyToDelete?.name}</strong>?
              </p>
              <p className="warning-text">This action cannot be undone.</p>
              {facultyToDelete?._id === 'bulk' && (
                <p className="bulk-warning">
                  This will permanently delete all selected faculty members and their associated data.
                </p>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary" 
                onClick={cancelDelete}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="btn-spinner">⟳</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🗑️</span>
                    {facultyToDelete?._id === 'bulk' ? 'Delete All Selected' : 'Delete Faculty'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyList;