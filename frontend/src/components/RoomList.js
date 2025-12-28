import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './RoomList.css';

const RoomList = ({ rooms, onDeleteRoom }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [viewMode, setViewMode] = useState('grid'); // grid or list
    const [selectedRooms, setSelectedRooms] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [roomToDelete, setRoomToDelete] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    // Get unique room types for filtering
    const roomTypes = useMemo(() => 
        [...new Set(rooms.map(room => room.type))].sort(),
        [rooms]
    );

    // Filter and sort rooms
    const filteredAndSortedRooms = useMemo(() => {
        let filtered = rooms.filter(room => {
            const matchesSearch = 
                room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.capacity.toString().includes(searchTerm);
            
            const matchesType = filterType === '' || room.type === filterType;
            return matchesSearch && matchesType;
        });

        // Sort rooms
        filtered.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            if (sortBy === 'name' || sortBy === 'type') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            } else if (sortBy === 'capacity') {
                aValue = parseInt(aValue);
                bValue = parseInt(bValue);
            }
            
            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [rooms, searchTerm, filterType, sortBy, sortOrder]);

    // Handle sorting
    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Handle room selection
    const toggleSelectRoom = (roomId) => {
        setSelectedRooms(prev => 
            prev.includes(roomId) 
                ? prev.filter(id => id !== roomId)
                : [...prev, roomId]
        );
    };

    const selectAllRooms = () => {
        if (selectedRooms.length === filteredAndSortedRooms.length) {
            setSelectedRooms([]);
        } else {
            setSelectedRooms(filteredAndSortedRooms.map(r => r._id));
        }
    };

    // Handle delete operations
    const handleDeleteClick = (room) => {
        setRoomToDelete(room);
        setShowDeleteModal(true);
    };

    const handleBulkDelete = () => {
        if (selectedRooms.length > 0) {
            setRoomToDelete({ _id: 'bulk', name: `${selectedRooms.length} rooms` });
            setShowDeleteModal(true);
        }
    };

    const confirmDelete = async () => {
        if (roomToDelete) {
            if (roomToDelete._id === 'bulk') {
                // Handle bulk delete
                for (const id of selectedRooms) {
                    await onDeleteRoom(id);
                }
                setSelectedRooms([]);
            } else {
                await onDeleteRoom(roomToDelete._id);
            }
            setShowDeleteModal(false);
            setRoomToDelete(null);
        }
    };

    const cancelDelete = () => {
        setShowDeleteModal(false);
        setRoomToDelete(null);
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm('');
        setFilterType('');
        setSortBy('name');
        setSortOrder('asc');
        setSelectedRooms([]);
    };

    // Calculate statistics
    const stats = useMemo(() => {
        const totalCapacity = rooms.reduce((sum, room) => sum + parseInt(room.capacity), 0);
        const avgCapacity = rooms.length > 0 ? Math.round(totalCapacity / rooms.length) : 0;
        
        return {
            total: rooms.length,
            types: roomTypes.length,
            totalCapacity,
            avgCapacity
        };
    }, [rooms, roomTypes]);

    if (!rooms || rooms.length === 0) {
        return (
            <div className="room-list-container">
                <div className="empty-state">
                    <span className="empty-icon">🏢</span>
                    <h3>No Rooms Available</h3>
                    <p>Start by adding your first room to manage your facilities</p>
                    <Link to="/rooms/add" className="btn btn-primary">
                        <span className="btn-icon">➕</span>
                        Add First Room
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="room-list-container">
            {/* Header Section */}
            <div className="list-header">
                <div className="header-content">
                    <h2 className="list-title">
                        <span className="title-icon">🏢</span>
                        Room Management
                        <span className="room-count">({filteredAndSortedRooms.length})</span>
                    </h2>
                    <p className="list-subtitle">
                        Manage your rooms and facility information
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
                                placeholder="Search by room name, type, or capacity..."
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
                                    <label className="filter-label">Room Type</label>
                                    <select
                                        className="filter-select"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                    >
                                        <option value="">All Types</option>
                                        {roomTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
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
                                        <option value="name">Room Name</option>
                                        <option value="type">Room Type</option>
                                        <option value="capacity">Capacity</option>
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

                        {selectedRooms.length > 0 && (
                            <div className="bulk-actions">
                                <span className="selection-count">
                                    {selectedRooms.length} selected
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
                        <span className="stat-label">Total Rooms</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.types}</span>
                        <span className="stat-label">Room Types</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.totalCapacity}</span>
                        <span className="stat-label">Total Capacity</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{stats.avgCapacity}</span>
                        <span className="stat-label">Avg Capacity</span>
                    </div>
                </div>
            </div>

            {/* Room Display */}
            <div className={`room-display ${viewMode}`}>
                {filteredAndSortedRooms.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">🔍</span>
                        <h3>No Rooms Found</h3>
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
                                        checked={selectedRooms.length === filteredAndSortedRooms.length}
                                        onChange={selectAllRooms}
                                        className="bulk-checkbox"
                                    />
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('name')}>
                                    Room Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('type')}>
                                    Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="sortable-header" onClick={() => handleSort('capacity')}>
                                    Capacity {sortBy === 'capacity' && (sortOrder === 'asc' ? '↑' : '↓')}
                                </div>
                                <div className="actions-header">Actions</div>
                            </div>
                        )}

                        {/* Room Items */}
                        <div className={`room-${viewMode}`}>
                            {filteredAndSortedRooms.map(room => (
                                <div 
                                    key={room._id} 
                                    className={`room-${viewMode === 'grid' ? 'card' : 'row'} ${
                                        selectedRooms.includes(room._id) ? 'selected' : ''
                                    }`}
                                >
                                    {/* Selection checkbox */}
                                    <div className="room-select">
                                        <input
                                            type="checkbox"
                                            checked={selectedRooms.includes(room._id)}
                                            onChange={() => toggleSelectRoom(room._id)}
                                            className="room-checkbox"
                                        />
                                    </div>

                                    {viewMode === 'grid' ? (
                                        // Grid Card Layout
                                        <>
                                            <div className="card-header">
                                                <div className="room-icon">
                                                    {room.type === 'Classroom' ? '🏫' : 
                                                     room.type === 'Lab' ? '🧪' : 
                                                     room.type === 'Hall' ? '🏛️' : '🏢'}
                                                </div>
                                                <div className="room-basic-info">
                                                    <h3 className="room-name">{room.name}</h3>
                                                    <p className="room-type">{room.type}</p>
                                                </div>
                                                <div className="capacity-badge">
                                                    <span>{room.capacity}</span>
                                                </div>
                                            </div>

                                            <div className="card-body">
                                                <div className="info-grid">
                                                    <div className="info-item">
                                                        <span className="info-icon">👥</span>
                                                        <div className="info-content">
                                                            <span className="info-label">Capacity</span>
                                                            <span className="info-value">{room.capacity} people</span>
                                                        </div>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="info-icon">🏷️</span>
                                                        <div className="info-content">
                                                            <span className="info-label">Type</span>
                                                            <span className="info-value">{room.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="card-actions">
                                                <Link 
                                                    to={`/rooms/edit/${room._id}`}
                                                    className="btn btn-secondary"
                                                >
                                                    <span className="btn-icon">✏️</span>
                                                    Edit
                                                </Link>
                                                <button 
                                                    className="btn btn-danger"
                                                    onClick={() => handleDeleteClick(room)}
                                                >
                                                    <span className="btn-icon">🗑️</span>
                                                    Delete
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        // List Row Layout
                                        <>
                                            <div className="room-name-cell">
                                                <div className="room-icon-sm">
                                                    {room.type === 'Classroom' ? '🏫' : 
                                                     room.type === 'Lab' ? '🧪' : 
                                                     room.type === 'Hall' ? '🏛️' : '🏢'}
                                                </div>
                                                <span className="room-name">{room.name}</span>
                                            </div>
                                            <div className="room-type-cell">{room.type}</div>
                                            <div className="room-capacity-cell">{room.capacity}</div>
                                            <div className="room-actions-cell">
                                                <Link 
                                                    to={`/rooms/edit/${room._id}`}
                                                    className="btn btn-secondary btn-sm"
                                                >
                                                    ✏️
                                                </Link>
                                                <button 
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteClick(room)}
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
                                {roomToDelete?._id === 'bulk' ? 'Confirm Bulk Deletion' : 'Confirm Deletion'}
                            </h3>
                            <span className="modal-icon">⚠️</span>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete <strong>{roomToDelete?.name}</strong>?
                            </p>
                            <p className="warning-text">This action cannot be undone.</p>
                            {roomToDelete?._id === 'bulk' && (
                                <p className="bulk-warning">
                                    This will permanently delete all selected rooms.
                                </p>
                            )}
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={cancelDelete}>
                                Cancel
                            </button>
                            <button className="btn btn-danger" onClick={confirmDelete}>
                                <span className="btn-icon">🗑️</span>
                                {roomToDelete?._id === 'bulk' ? 'Delete All Selected' : 'Delete Room'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomList;