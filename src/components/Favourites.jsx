
import { useEffect, useState } from "react";
import { Card, Row, Col, Alert, Spinner } from "react-bootstrap";

const Favourites = () => {
	const [favourites, setFavourites] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		fetchFavourites();
	}, []);

	const fetchFavourites = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem('token');
			
			if (!token) {
				setError('Please log in to view your favorites');
				setLoading(false);
				return;
			}

			const response = await fetch('/api/user/favorites', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const data = await response.json();
				setFavourites(data);
				setError('');
			} else if (response.status === 401) {
				setError('Please log in to view your favorites');
				localStorage.removeItem('token'); // Remove invalid token
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Failed to load favorites');
			}
		} catch (error) {
			console.error('Error fetching favorites:', error);
			setError('Failed to connect to server');
		} finally {
			setLoading(false);
		}
	};

	const removeFavorite = async (googleId) => {
		try {
			const token = localStorage.getItem('token');
			
			if (!token) {
				setError('Please log in to manage favorites');
				return;
			}

			const response = await fetch(`/api/user/favorites/${googleId}`, {
				method: 'DELETE',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const data = await response.json();
				setFavourites(data.favorites);
				setError('');
			} else {
				const errorData = await response.json();
				setError(errorData.message || 'Failed to remove from favorites');
			}
		} catch (error) {
			console.error('Error removing favorite:', error);
			setError('Failed to remove from favorites');
		}
	};

	if (loading) {
		return (
			<div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
				<div className="text-center">
					<Spinner animation="border" variant="primary" />
					<p className="mt-3">Loading your favorites...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-5" style={{ minHeight: '100vh', color: '#222' }}>
			<h2 className="text-center mb-4" style={{ color: '#ff6a00', fontWeight: 700 }}>Your Favourites</h2>
			
			{error && (
				<Alert variant="danger" className="text-center">
					{error}
				</Alert>
			)}
			
			{favourites.length === 0 ? (
				<div className="text-center py-5">
					<div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
					<p className="lead">No favourite books yet!</p>
					<p>Add some books from the Book Recommendation page to see them here.</p>
				</div>
			) : (
				<Row>
					{favourites.map((book) => (
						<Col md={3} key={book.googleId || book.title} className="mb-4">
							<Card className="h-100 book-card position-relative" style={{ cursor: 'pointer' }}>
								{/* Remove button */}
								<button
									className="btn-close position-absolute"
									style={{ 
										top: '10px', 
										right: '10px', 
										zIndex: 2,
										backgroundColor: 'rgba(255,255,255,0.9)',
										borderRadius: '50%',
										width: '30px',
										height: '30px',
										border: '1px solid #ddd'
									}}
									onClick={(e) => {
										e.stopPropagation();
										removeFavorite(book.googleId);
									}}
									title="Remove from favorites"
								/>
								
								<div 
									style={{
										background: '#fff',
										borderRadius: '8px',
										boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
										border: '1px solid #e0e0e0',
										width: '100%',
										height: '220px',
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										overflow: 'hidden',
										marginBottom: '0px',
										padding: '0'
									}}
									onClick={() => window.open(`https://books.google.com/books?id=${book.googleId}`, '_blank')}
								>
									<img
										src={book.image && book.image !== '/images/no_cover.jpg' ? book.image : 'https://books.google.com/googlebooks/images/no_cover_thumb.gif'}
										alt={book.title}
										style={{
											height: '200px',
											width: 'auto',
											objectFit: 'contain',
											background: '#fff',
											margin: '0',
											display: 'block',
											borderRadius: '4px',
											boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
										}}
										loading="lazy"
									/>
								</div>
								<Card.Body style={{ padding: '0.75rem 1rem 1rem 1rem' }}>
									<Card.Title style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
										{book.title}
									</Card.Title>
									<Card.Text style={{ fontSize: '0.9rem', color: '#666' }}>
										{book.authors ? book.authors.join(', ') : 'Unknown Author'}
									</Card.Text>
								</Card.Body>
							</Card>
						</Col>
					))}
				</Row>
			)}
		</div>
	);
};

export default Favourites;
