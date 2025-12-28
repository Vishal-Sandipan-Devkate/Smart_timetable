import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './BatchList.css';

const BatchList = ({ batches, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [batchToDelete, setBatchToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Get unique departments and years for filtering
    const departments = useMemo(() => 
        [...new Set(batches.map(batch => batch.department))].sort(),
        [batches]
    );

    const years = useMemo(() => 
        [...new Set(batches.map(batch => batch.year))].sort((a, b) => b - a),
        [batches]
    );

    // Filter and sort batches
    const filteredAndSortedBatches = useMemo(() => {
        let filtered = batches.filter(batch => {
            const matchesSearch = 
                batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                batch.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                batch.year.toString().includes(searchTerm) ||
                batch.subjects.some(subject => 
                    subject.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
            
            const matchesDepartment = filterDepartment === '' || batch.department === filterDepartment;
            const matchesYear = filterYear === '' || batch.year.toString() === filterYear;
            
            return matchesSearch && matchesDepartment && matchesYear;
        });

        // Sort batches
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'name' || sortBy === 'department') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (sortBy === 'year' || sortBy === 'strength') {
                aValue = parseInt(aValue);
                bValue = parseInt(bValue);
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [batches, searchTerm, filterDepartment, filterYear, sortBy, sortOrder]);

    // Handle sorting
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Handle batch selection
    const toggleSelectBatch = (batchId) => {
        setSelectedBatches(prev => 
            prev.includes(batchId) 
                ? prev.filter(id => id !== batchId)
                : [...prev, batchId]
        );
    };

    const selectAllBatches = () => {
        if (selectedBatches.length === filteredAndSortedBatches.length) {
            setSelectedBatches([]);
        } else {
            setSelectedBatches(filteredAndSortedBatches.map(b => b._id));
        }
    };

    // Handle delete operations
    const handleDeleteClick = (batch) => {
        setBatchToDelete(batch);
        setShowDeleteModal(true);
    };

    const handleBulkDelete = () => {
        if (selectedBatches.length > 0) {
            setBatchToDelete({ _id: 'bulk', name: `${selectedBatches.length} batches` });
            setShowDeleteModal(true);
        }
    };

    const confirmDelete = async () => {
        if (batchToDelete) {
            if (batchToDelete._id === 'bulk') {
                for (const id of selectedBatches) {
                    await onDelete(id);
                }
                setSelectedBatches([]);
            } else {
                await onDelete(batchToDelete._id);
            }
            setShowDeleteModal(false);
            setBatchToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setBatchToDelete(null);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setFilterDepartment('');
        setFilterYear('');
        setSortBy('name');
        setSortOrder('asc');
        setSelectedBatches([]);
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalStrength = batches.reduce((sum, batch) => sum + parseInt(batch.strength), 0);
        const avgStrength = batches.length > 0 ? Math.round(totalStrength / batches.length) : 0;
        const totalSubjects = batches.reduce((sum, batch) => sum + batch.subjects.length, 0);
        
        return {
            total: batches.length,
            departments: departments.length,
            years: years.length,
            totalStrength,
            avgStrength,
            totalSubjects
        };
    }, [batches, departments.length, years.length]);

    if (!batches || batches.length === 0) {
        return (
            <div className="batch-list-container">
                <div className="empty-state">
                    <span className="empty-icon">🎓</span>
                    <h3>No Batches Available</h3>
                    <p>Start by adding your first batch to organize your students</p>
                    <Link to="/batches/add" className="btn btn-primary">
                        <span className="btn-icon">➕</span>
                        Add First Batch
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="batch-list-container">
            {/* Header Section */}
            <div className="list-header">
                <div className="header-content">
                    <h2 className="list-title">
                        <span className="title-icon">🎓</span>
                        Batch Management
                        <span className="batch-count">({filteredAndSortedBatches.length})</span>
                    </h2>
                    <p className="list-subtitle">
                        Manage student batches and their academic information
                    </p>
                </div>

                {/* Controls */}
                <div className="controls-section">
                    <div className="search-and-filters">
                        <div className="search-box">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                className="search-input"
                                placeholder="Search by batch name, department, year, or subjects..."
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
                                    <label className="filter-label">Academic Year</label>
                                    <select
                                        className="filter-select"
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                    >
                                        <option value="">All Years</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
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
                                        <option value="name">Batch Name</option>
                                        <option value="department">Department</option>
                                        <option value="year">Year</option>
                                        <option value="strength">Strength</option>
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
                            </div>

                            <div className="filter-actions">
                                <button className="btn btn-clear" onClick={clearFilters}>
                                    <span className="btn-icon">🧹</span>
                                    Clear All
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

                        {selectedBatches.length > 0 && (
                            <div className="bulk-actions">
                                <span className="selection-count">
                                    {selectedBatches.length} selected
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

                {/* Statistics */}
                <div className="quick-stats">
                    <div className="stat-item">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total Batches</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.departments}</span>
                        <span className="stat-label">Departments</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.totalStrength}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.avgStrength}</span>
                        <span className="stat-label">Avg Batch Size</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.totalSubjects}</span>
                        <span className="stat-label">Total Subjects</span>
                    </div>
                </div>
            </div>

            {/* Batch Display */}
            <div className={`batch-display ${viewMode}`}>
                {filteredAndSortedBatches.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔍</span>
                        <h3>No Batches Found</h3>
                        <p>Try adjusting your search or filter criteria</p>
                        <button className="btn btn-secondary" onClick={clearFilters}>
                            <span className="btn-icon">🧹</span>
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <>
                        {/* List Header */}
                        {viewMode === 'list' && (
                            <div className="list-header-row">
                                <div className="bulk-select">
                                    <input
                                        type="checkbox"
                                        checked={selectedBatches.length === filteredAndSortedBatches.length}
                                        onChange={selectAllBatches}
                                        className="bulk-checkbox"
                                    />
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('name')}>
                                    Batch Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('department')}>
                                    Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('year')}>
                                    Year {sortBy === 'year' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('strength')}>
                                    Strength {sortBy === 'strength' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="actions-header">Actions</div>
                            </div>
                        )}

                        {/* Batch Items */}
                        <div className={`batch-${viewMode}`}>
                            {filteredAndSortedBatches.map(batch => (
                                <div 
                                    key={batch._id} 
                                    className={`batch-${viewMode === 'grid' ? 'card' : 'row'} ${
                                        selectedBatches.includes(batch._id) ? 'selected' : ''
                                    }`}
                                >
                                    {/* Selection checkbox */}
                                    <div className="batch-select">
                                        <input
                                            type="checkbox"
                                            checked={selectedBatches.includes(batch._id)}
                                            onChange={() => toggleSelectBatch(batch._id)}
                                            className="batch-checkbox"
                                        />
                                    </div>

                                    {viewMode === 'grid' ? (
                                        // Grid Card Layout
                                        <>
                                            <div className="card-header">
                                                <div className="batch-icon">
                                                    <span className="batch-year">{batch.year}</span>
                                                </div>
                                                <div className="batch-basic-info">
                                                    <h3 className="batch-name">{batch.name}</h3>
                                                    <p className="batch-department">{batch.department}</p>
                                                </div>
                                                <div className="strength-badge">
                                                    <span>{batch.strength}</span>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="info-grid">
                                                    <div className="info-item">
                                                        <span className="info-icon">🏫</span>
                                                        <div className="info-content">
                                                            <span className="info-label">Department</span>
                                                            <span className="info-value">{batch.department}</span>
                                                        </div>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-icon">📅</span>
                                                        <div className="info-content">
                                                            <span className="info-label">Academic Year</span>
                                                            <span className="info-value">{batch.year}</span>
                                                        </div>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-icon">👥</span>
                                                        <div className="info-content">
                                                            <span className="info-label">Batch Strength</span>
                                                            <span className="info-value">{batch.strength} students</span>
                                                        </div>
                                                    </div>
                                                    <div className="info-item full-width">
                                                        <span className="info-icon">📚</span>
                                                        <div className="info-content">
                                                            <span className="info-label">Subjects ({batch.subjects.length})</span>
                                                            <div className="subjects-tags">
                                                                {batch.subjects.slice(0, 4).map((subject, index) => (
                                                                    <span key={index} className="subject-tag">
                                                                        {subject.name}
                                                                    </span>
                                                                ))}
                                                                {batch.subjects.length > 4 && (
                                                                    <span className="subject-tag more">
                                                                        +{batch.subjects.length - 4} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <Link 
                                                    to={`/batches/edit/${batch._id}`}
                                                    className="btn btn-secondary"
                                                >
                                                    <span className="btn-icon">✏️</span>
                                                    Edit
                                                </Link>
                                                <button 
                                                    className="btn btn-danger"
                                                    onClick={() => handleDeleteClick(batch)}
                                                >
                                                    <span className="btn-icon">🗑️</span>
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        // List Row Layout
                                        <>
                                            <div className="batch-name-cell">
                                                <div className="batch-icon-sm">
                                                    <span className="batch-year-sm">{batch.year}</span>
                                                </div>
                                                <span className="batch-name">{batch.name}</span>
                                            </div>
                                            <div className="batch-department-cell">{batch.department}</div>
                                            <div className="batch-year-cell">{batch.year}</div>
                                            <div className="batch-strength-cell">{batch.strength}</div>
                                            <div className="batch-actions-cell">
                                                <Link 
                                                    to={`/batches/edit/${batch._id}`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    ✏️
                                                </Link>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteClick(batch)}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={cancelDelete}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {batchToDelete?._id === 'bulk' ? 'Confirm Bulk Deletion' : 'Confirm Deletion'}
                            </h3>
                            <span className="modal-icon">⚠️</span>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete <strong>{batchToDelete?.name}</strong>?
                            </p>
                            <p className="warning-text">This action cannot be undone.</p>
                            {batchToDelete?._id === 'bulk' && (
                                <p className="bulk-warning">
                                    This will permanently delete all selected batches and their associated data.
                                </p>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <span className="btn-icon">🗑️</span>
                                {batchToDelete?._id === 'bulk' ? 'Delete All Selected' : 'Delete Batch'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchList;