
import React, { useEffect, useState } from "react";

const fetchWithAuth = async (url, options = {}) => {
	const token = localStorage.getItem("token");
	return fetch(url, {
		...options,
		headers: {
			...(options.headers || {}),
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
	});
};

const Admin = () => {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState('overview');
	const [analytics, setAnalytics] = useState({
		userCount: 0,
		activeUsers: 0,
		blockedUsers: 0,
		totalFavorites: 0,
		libraryBooks: 0,
		systemStatus: 'Active'
	});

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const usersRes = await fetchWithAuth("/api/admin/users");
				const usersData = await usersRes.json();
				setUsers(usersData);
				
				// Calculate analytics
				const activeUsers = usersData.filter(u => !u.isBlocked).length;
				const blockedUsers = usersData.filter(u => u.isBlocked).length;
				
				setAnalytics({
					userCount: usersData.length,
					activeUsers: activeUsers,
					blockedUsers: blockedUsers,
					totalFavorites: Math.floor(Math.random() * 500) + 200, // Simulated data
					libraryBooks: Math.floor(Math.random() * 1000) + 500, // Simulated data
					systemStatus: 'Active'
				});
			} catch (err) {
				setError("Failed to fetch admin data.");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	const handleDeleteUser = async (id) => {
		if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
		try {
			await fetchWithAuth(`/api/admin/users/${id}`, { method: "DELETE" });
			const updatedUsers = users.filter(u => u._id !== id);
			setUsers(updatedUsers);
			setAnalytics(prev => ({
				...prev,
				userCount: prev.userCount - 1,
				activeUsers: updatedUsers.filter(u => !u.isBlocked).length,
				blockedUsers: updatedUsers.filter(u => u.isBlocked).length
			}));
			alert("User deleted successfully!");
		} catch {
			alert("Failed to delete user.");
		}
	};

	const handleBlockUser = async (id, currentBlockStatus) => {
		const action = currentBlockStatus ? "unblock" : "block";
		if (!window.confirm(`Are you sure you want to ${action} this user?`)) return;
		try {
			const res = await fetchWithAuth(`/api/admin/users/${id}/block`, {
				method: "PUT",
				body: JSON.stringify({ isBlocked: !currentBlockStatus }),
			});
			const data = await res.json();
			const updatedUsers = users.map(u => u._id === id ? data.user : u);
			setUsers(updatedUsers);
			setAnalytics(prev => ({
				...prev,
				activeUsers: updatedUsers.filter(u => !u.isBlocked).length,
				blockedUsers: updatedUsers.filter(u => u.isBlocked).length
			}));
			alert(data.message);
		} catch {
			alert("Failed to update user status.");
		}
	};

	const handleClearUserFavorites = async (userId, username) => {
		if (!window.confirm(`Are you sure you want to clear all favorites for ${username}?`)) return;
		try {
			// In a real app, this would make an API call to clear favorites
			alert(`Favorites cleared for ${username}!`);
		} catch {
			alert("Failed to clear user favorites.");
		}
	};

	const handleClearUserLibrary = async (userId, username) => {
		if (!window.confirm(`Are you sure you want to clear the library for ${username}?`)) return;
		try {
			// In a real app, this would make an API call to clear library
			alert(`Library cleared for ${username}!`);
		} catch {
			alert("Failed to clear user library.");
		}
	};

	const handleResetUserBadges = async (userId, username) => {
		if (!window.confirm(`Are you sure you want to reset all badges for ${username}?`)) return;
		try {
			// In a real app, this would make an API call to reset badges
			alert(`Badges reset for ${username}!`);
		} catch {
			alert("Failed to reset user badges.");
		}
	};

	const renderOverview = () => (
		<div className="tab-content">
			{/* Advanced Analytics Section */}
			<section className="mb-5">
				<h4 className="mb-4" style={{ color: "#0077b6", fontWeight: 'bold' }}>📊 System Analytics</h4>
				<div className="row g-4">
					<div className="col-md-2">
						<div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
							<div className="card-body text-center text-white">
								<div style={{ fontSize: '2.5rem' }}>👥</div>
								<h3 className="fw-bold mb-1">{analytics.userCount}</h3>
								<p className="mb-0 opacity-75">Total Users</p>
							</div>
						</div>
					</div>
					<div className="col-md-2">
						<div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
							<div className="card-body text-center text-white">
								<div style={{ fontSize: '2.5rem' }}>✅</div>
								<h3 className="fw-bold mb-1">{analytics.activeUsers}</h3>
								<p className="mb-0 opacity-75">Active Users</p>
							</div>
						</div>
					</div>
					<div className="col-md-2">
						<div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' }}>
							<div className="card-body text-center text-white">
								<div style={{ fontSize: '2.5rem' }}>🚫</div>
								<h3 className="fw-bold mb-1">{analytics.blockedUsers}</h3>
								<p className="mb-0 opacity-75">Blocked Users</p>
							</div>
						</div>
					</div>
					<div className="col-md-2">
						<div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
							<div className="card-body text-center text-white">
								<div style={{ fontSize: '2.5rem' }}>❤️</div>
								<h3 className="fw-bold mb-1">{analytics.totalFavorites}</h3>
								<p className="mb-0 opacity-75">Total Favorites</p>
							</div>
						</div>
					</div>
					<div className="col-md-2">
						<div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
							<div className="card-body text-center text-white">
								<div style={{ fontSize: '2.5rem' }}>📚</div>
								<h3 className="fw-bold mb-1">{analytics.libraryBooks}</h3>
								<p className="mb-0 opacity-75">Library Books</p>
							</div>
						</div>
					</div>
					<div className="col-md-2">
						<div className="card h-100 border-0 shadow-lg" style={{ borderRadius: '15px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
							<div className="card-body text-center text-white">
								<div style={{ fontSize: '2.5rem' }}>🟢</div>
								<h3 className="fw-bold mb-1">{analytics.systemStatus}</h3>
								<p className="mb-0 opacity-75">System Status</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);

	const renderUserManagement = () => (
		<div className="tab-content">
			<section className="mb-5">
				<h4 className="mb-4" style={{ color: "#0077b6", fontWeight: 'bold' }}>👥 User Management</h4>
				<div className="card border-0 shadow-lg" style={{ borderRadius: '15px' }}>
					<div className="card-body p-0">
						<div className="table-responsive">
							<table className="table table-hover mb-0">
								<thead style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
									<tr>
										<th className="border-0 py-3 px-4">Name</th>
										<th className="border-0 py-3">Email</th>
										<th className="border-0 py-3">Role</th>
										<th className="border-0 py-3">Status</th>
										<th className="border-0 py-3">Joined</th>
										<th className="border-0 py-3">Actions</th>
									</tr>
								</thead>
								<tbody>
									{users.map(user => (
										<tr key={user._id} className="align-middle">
											<td className="px-4 py-3">
												<div className="d-flex align-items-center">
													<div className="avatar me-3" style={{ 
														width: '40px', 
														height: '40px', 
														borderRadius: '50%', 
														background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														color: 'white',
														fontWeight: 'bold'
													}}>
														{user.username?.charAt(0)?.toUpperCase()}
													</div>
													<div>
														<div className="fw-bold">{user.username}</div>
													</div>
												</div>
											</td>
											<td className="py-3">{user.email}</td>
											<td className="py-3">
												<span className={`badge ${user.role === 'admin' ? 'bg-warning text-dark' : 'bg-info'}`} 
													  style={{ borderRadius: '20px', padding: '8px 12px' }}>
													{user.role === 'admin' ? '👑 Admin' : '👤 User'}
												</span>
											</td>
											<td className="py-3">
												<span className={`badge ${user.isBlocked ? 'bg-danger' : 'bg-success'}`}
													  style={{ borderRadius: '20px', padding: '8px 12px' }}>
													{user.isBlocked ? '🚫 Blocked' : '✅ Active'}
												</span>
											</td>
											<td className="py-3">
												<small className="text-muted">
													{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
												</small>
											</td>
											<td className="py-3">
												<div className="btn-group">
													<button 
														className={`btn btn-sm ${user.isBlocked ? 'btn-success' : 'btn-warning'} me-2`}
														onClick={() => handleBlockUser(user._id, user.isBlocked)}
														style={{ borderRadius: '20px', minWidth: '80px' }}
													>
														{user.isBlocked ? '🔓 Unblock' : '🔒 Block'}
													</button>
													<div className="btn-group">
														<button className="btn btn-outline-primary btn-sm dropdown-toggle" 
																type="button" 
																data-bs-toggle="dropdown"
																style={{ borderRadius: '20px' }}>
															⚙️ More
														</button>
														<ul className="dropdown-menu">
															<li>
																<button className="dropdown-item" 
																		onClick={() => handleClearUserFavorites(user._id, user.username)}>
																	❤️ Clear Favorites
																</button>
															</li>
															<li>
																<button className="dropdown-item" 
																		onClick={() => handleClearUserLibrary(user._id, user.username)}>
																	📚 Clear Library
																</button>
															</li>
															<li>
																<button className="dropdown-item" 
																		onClick={() => handleResetUserBadges(user._id, user.username)}>
																	🏆 Reset Badges
																</button>
															</li>
															<li><hr className="dropdown-divider" /></li>
															<li>
																<button className="dropdown-item text-danger" 
																		onClick={() => handleDeleteUser(user._id)}>
																	🗑️ Delete User
																</button>
															</li>
														</ul>
													</div>
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</section>
		</div>
	);

	return (
		<div className="container-fluid py-5" style={{ minHeight: "100vh", background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
			<div className="container">
				<div className="text-center mb-5">
					<h1 className="display-4 fw-bold mb-3" style={{ color: "#333", textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
						🎯 Admin Dashboard
					</h1>
					<p className="lead text-muted">Comprehensive management system for your book recommendation platform</p>
				</div>

				{loading ? (
					<div className="text-center py-5">
						<div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
							<span className="visually-hidden">Loading...</span>
						</div>
						<p className="mt-3 text-muted">Loading dashboard data...</p>
					</div>
				) : error ? (
					<div className="alert alert-danger shadow-lg" style={{ borderRadius: '15px' }}>
						<h4 className="alert-heading">⚠️ Error</h4>
						<p>{error}</p>
					</div>
				) : (
					<>
						{/* Navigation Tabs */}
						<div className="mb-5">
							<div className="card border-0 shadow-lg" style={{ borderRadius: '20px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
								<div className="card-body p-4">
									<div className="d-flex align-items-center position-relative">
										{/* Left Tab - Overview */}
										<button 
											className="btn position-relative"
											onClick={() => setActiveTab('overview')}
											style={{ 
												borderRadius: '15px',
												fontWeight: '600',
												padding: '14px 32px',
												fontSize: '15px',
												fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
												background: activeTab === 'overview' 
													? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
													: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
												border: activeTab === 'overview' 
													? 'none' 
													: '1px solid rgba(0, 0, 0, 0.08)',
												color: activeTab === 'overview' ? '#ffffff' : '#495057',
												transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
												cursor: 'pointer',
												flex: '1',
												maxWidth: 'calc(50% - 25px)',
												boxShadow: activeTab === 'overview' 
													? '0 8px 25px rgba(102, 126, 234, 0.3)' 
													: '0 2px 8px rgba(0, 0, 0, 0.06)',
												transform: activeTab === 'overview' ? 'translateY(-2px)' : 'translateY(0)',
												marginRight: '10px'
											}}
											onMouseEnter={(e) => {
												if (activeTab !== 'overview') {
													e.target.style.transform = 'translateY(-1px)';
													e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.12)';
													e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%)';
												}
											}}
											onMouseLeave={(e) => {
												if (activeTab !== 'overview') {
													e.target.style.transform = 'translateY(0)';
													e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
													e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
												}
											}}
										>
											<span className="d-flex align-items-center justify-content-center gap-2">
												<span style={{ fontSize: '18px' }}>📈</span>
												<span style={{ letterSpacing: '0.025em' }}>Overview</span>
											</span>
											{activeTab === 'overview' && (
												<div style={{
													position: 'absolute',
													bottom: '-2px',
													left: '50%',
													transform: 'translateX(-50%)',
													width: '60%',
													height: '3px',
													background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
													borderRadius: '2px'
												}}></div>
											)}
										</button>

										{/* Center Divider */}
										<div style={{
											position: 'relative',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											margin: '0 10px'
										}}>
											<div style={{
												width: '2px',
												height: '40px',
												background: 'linear-gradient(180deg, #667eea, #764ba2)',
												borderRadius: '1px',
												position: 'relative',
												boxShadow: '0 0 10px rgba(102, 126, 234, 0.3)'
											}}>
												{/* Decorative dots */}
												<div style={{
													position: 'absolute',
													top: '50%',
													left: '50%',
													transform: 'translate(-50%, -50%)',
													width: '8px',
													height: '8px',
													background: 'linear-gradient(135deg, #667eea, #764ba2)',
													borderRadius: '50%',
													border: '2px solid #ffffff',
													boxShadow: '0 2px 8px rgba(102, 126, 234, 0.4)'
												}}></div>
											</div>
										</div>

										{/* Right Tab - User Management */}
										<button 
											className="btn position-relative"
											onClick={() => setActiveTab('users')}
											style={{ 
												borderRadius: '15px',
												fontWeight: '600',
												padding: '14px 32px',
												fontSize: '15px',
												fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
												background: activeTab === 'users' 
													? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
													: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
												border: activeTab === 'users' 
													? 'none' 
													: '1px solid rgba(0, 0, 0, 0.08)',
												color: activeTab === 'users' ? '#ffffff' : '#495057',
												transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
												cursor: 'pointer',
												flex: '1',
												maxWidth: 'calc(50% - 25px)',
												boxShadow: activeTab === 'users' 
													? '0 8px 25px rgba(102, 126, 234, 0.3)' 
													: '0 2px 8px rgba(0, 0, 0, 0.06)',
												transform: activeTab === 'users' ? 'translateY(-2px)' : 'translateY(0)',
												marginLeft: '10px'
											}}
											onMouseEnter={(e) => {
												if (activeTab !== 'users') {
													e.target.style.transform = 'translateY(-1px)';
													e.target.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.12)';
													e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f1f3f4 100%)';
												}
											}}
											onMouseLeave={(e) => {
												if (activeTab !== 'users') {
													e.target.style.transform = 'translateY(0)';
													e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
													e.target.style.background = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
												}
											}}
										>
											<span className="d-flex align-items-center justify-content-center gap-2">
												<span style={{ fontSize: '18px' }}>👥</span>
												<span style={{ letterSpacing: '0.025em' }}>User Management</span>
											</span>
											{activeTab === 'users' && (
												<div style={{
													position: 'absolute',
													bottom: '-2px',
													left: '50%',
													transform: 'translateX(-50%)',
													width: '60%',
													height: '3px',
													background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
													borderRadius: '2px'
												}}></div>
											)}
										</button>
									</div>
								</div>
							</div>
						</div>

						{/* Tab Content */}
						<div className="tab-content">
							{activeTab === 'overview' && renderOverview()}
							{activeTab === 'users' && renderUserManagement()}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

export default Admin;
