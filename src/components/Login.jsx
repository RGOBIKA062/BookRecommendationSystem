import React, { useState } from "react";
import "../style/Home.css";
import { apiUrl } from "../utils/apiUrl";

const Login = () => {
	const [form, setForm] = useState({ email: "", password: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

		const handleSubmit = async (e) => {
			e.preventDefault();
			setLoading(true);
			setError("");
			try {
				const res = await fetch(apiUrl("/api/auth/login"), {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(form),
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.message || "Login failed");
				localStorage.setItem("token", data.token);
				localStorage.setItem("user", JSON.stringify(data.user));
				window.location.href = data.user.role === "admin" ? "/admin" : "/home";
			} catch (err) {
				setError(err.message);
			} finally {
				setLoading(false);
			}
		};

	return (
		<div className="home-landing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', overflow: 'hidden' }}>
			<div className="card p-5 shadow-lg" style={{
				maxWidth: '400px',
				width: '100%',
				borderRadius: '20px',
				background: 'rgba(255,255,255,0.05)',
				border: '1px solid rgba(255,255,255,0.1)',
				margin: '0 auto',
				boxSizing: 'border-box',
				transform: 'translateY(-60px)'
			}}>
				<h2 className="gradient-text mb-4" style={{ fontWeight: 'bold', fontSize: '2.5rem', textAlign: 'center' }}>Login</h2>
				<form onSubmit={handleSubmit}>
					<div className="mb-3">
						<label htmlFor="email" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Email address</label>
						<input type="email" className="form-control" id="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email" required />
					</div>
					<div className="mb-4">
						<label htmlFor="password" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Password</label>
						<input type="password" className="form-control" id="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" required />
					</div>
					{error && <div className="alert alert-danger py-2">{error}</div>}
					<button type="submit" className="btn w-100 py-2" style={{ fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#ff6600', borderColor: '#ff6600', color: 'white' }} disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
				</form>
				<div className="mt-4 text-center">
					<span style={{ color: '#fff' }}>Don't have an account?</span>
					<a href="/signup" className="ms-2" style={{ color: '#ff6a00', fontWeight: 'bold', textDecoration: 'underline' }}>Sign up</a>
				</div>
			</div>
		</div>
	);
};

export default Login;
