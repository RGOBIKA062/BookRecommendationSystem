import React, { useState, useCallback, useEffect } from "react";
import SearchBar from "./SearchBar";
import FeaturedBooks from "./FeaturedBooks";

const BookRecommendation = () => {
	const [books, setBooks] = useState([]);
	const [searchQuery, setSearchQuery] = useState("story books");
	const [favourites, setFavourites] = useState([]);
	const [library, setLibrary] = useState({});

	useEffect(() => {
		fetchBooks(""); // Load default books initially
		fetchUserData(); // Load user's favorites and library
	}, []);

	const fetchUserData = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			// Fetch favorites
			const favResponse = await fetch('/api/user/favorites', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			
			if (favResponse.ok) {
				const favData = await favResponse.json();
				setFavourites(favData);
			}

		// Fetch library
		const libResponse = await fetch('/api/user/library', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			}
		});			if (libResponse.ok) {
				const libData = await libResponse.json();
				setLibrary(libData);
			}
		} catch (error) {
			console.error('Error fetching user data:', error);
		}
	};

	// Standalone library fetch function
	const fetchLibrary = async () => {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const libResponse = await fetch('/api/user/library', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				}
			});
			
			if (libResponse.ok) {
				const libData = await libResponse.json();
				setLibrary(libData);
			}
		} catch (error) {
			console.error('Error fetching library:', error);
		}
	};

	// Add/remove favourite
	const handleFavourite = async (book) => {
		const token = localStorage.getItem('token');
		if (!token) {
			alert('Please log in to manage favorites');
			return;
		}

		try {
			const isCurrentlyFav = favourites.some((b) => b.googleId === book.googleId);
			
			if (isCurrentlyFav) {
				// Remove from favorites
				const response = await fetch(`/api/user/favorites/${book.googleId}`, {
					method: 'DELETE',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					}
				});

				if (response.ok) {
					const data = await response.json();
					setFavourites(data.favorites);
				}
			} else {
				// Add to favorites
				const bookData = {
					googleId: book.id,
					title: book.title,
					authors: book.author ? [book.author] : [],
					image: book.image,
					description: book.description || ''
				};

				const response = await fetch('/api/user/favorites', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ book: bookData })
				});

				if (response.ok) {
					const data = await response.json();
					setFavourites(data.favorites);
				}
			}
		} catch (error) {
			console.error('Error managing favorites:', error);
		}
	};

	// Add to library list
	const handleAddToLibrary = async (book, listName) => {
		const token = localStorage.getItem('token');
		if (!token) {
			alert('Please log in to manage your library');
			return;
		}

		try {
			const bookData = {
				googleId: book.id || book.googleId,
				title: book.title,
				authors: book.author ? [book.author] : (book.authors || []),
				image: book.image,
				description: book.description || '',
				listName: listName
			};

			const response = await fetch('/api/user/library', {
				method: 'POST',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(bookData)
			});

			if (response.ok) {
				const data = await response.json();
				// Refresh the library data
				fetchLibrary();
				alert(`📚 Book added to "${listName}" successfully!`);
			} else {
				const errorData = await response.json();
				alert(errorData.message || 'Failed to add book to library');
			}
		} catch (error) {
			console.error('Error adding to library:', error);
			alert('Failed to add book to library');
		}
	};

	const fetchBooks = useCallback((query = "", genre = "") => {
		let finalQuery = query.trim() || "story books";
		if (genre) finalQuery += `+subject:${genre}`;

		setSearchQuery(finalQuery);

		fetch(`https://www.googleapis.com/books/v1/volumes?q=${finalQuery}&maxResults=12`)
			.then((res) => res.json())
			.then((data) => {
				if (data.items) {
					const bookData = data.items.map((item) => ({
						id: item.id,
						googleId: item.id, // Add googleId for consistency
						title: item.volumeInfo.title,
						author: item.volumeInfo.authors
							? item.volumeInfo.authors.join(", ")
							: "Unknown",
						image: item.volumeInfo.imageLinks
							? item.volumeInfo.imageLinks.thumbnail
							: "/images/no_cover.jpg",
						description: item.volumeInfo.description || ""
					}));
					setBooks(bookData);
				} else {
					setBooks([]);
				}
			})
			.catch((err) => console.error("Error fetching books:", err));
	}, []);

	const genres = ["Fiction", "Non-Fiction", "Mystery", "Romance", "Sci-Fi", "Fantasy", "Biography", "History"];

	return (
		<div style={{ backgroundColor: "#111", minHeight: "100vh", color: "#fff" }}>
			<div className="container py-5">
				<div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
					<h1 style={{
						fontSize: '2.4rem',
						fontWeight: 600,
						color: '#ff6a00',
						letterSpacing: '1px',
						margin: 0,
						padding: '0.5rem 0',
						textAlign: 'center',
						fontFamily: 'Segoe UI, Arial, sans-serif',
					}}>
						📚 Book Recommender
					</h1>
				</div>
				<SearchBar onSearch={fetchBooks} genres={genres} />
				<FeaturedBooks
					books={books}
					query={searchQuery}
					favourites={favourites}
					library={library}
					onFavourite={handleFavourite}
					onAddToLibrary={handleAddToLibrary}
				/>
			</div>
		</div>
	);
};

export default BookRecommendation;