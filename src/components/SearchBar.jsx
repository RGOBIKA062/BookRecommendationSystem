import React, { useState } from "react";
import { Form, Row, Col, Button } from "react-bootstrap";

function SearchBar({ onSearch, genres = [] }) {
  const [query, setQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(query.trim(), selectedGenre);
  };

  return (
    <Form onSubmit={handleSearch} className="mb-4">
      <Row className="align-items-center">
        <Col md={5} className="mb-2 mb-md-0">
          <Form.Control
            type="text"
            placeholder="Search for books..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Col>
        <Col md={5} className="mb-2 mb-md-0">
          <Form.Select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {genres.map((genre, index) => (
              <option key={index} value={genre}>
                {genre}
              </option>
            ))}
          </Form.Select>
        </Col>
        <Col md={2}>
          <Button
            type="submit"
            className="w-100"
            style={{
              background: 'linear-gradient(90deg, #ff6a00 0%, #ee0979 100%)',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              boxShadow: '0 2px 8px rgba(238,9,121,0.15)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 0'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke="#fff" strokeWidth="2"/><path stroke="#fff" strokeWidth="2" strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>
            Search
          </Button>
        </Col>
      </Row>
    </Form>
  );
}

export default SearchBar;
