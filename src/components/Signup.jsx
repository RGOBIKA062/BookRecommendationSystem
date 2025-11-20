
import React, { useState } from "react";
import "../style/Home.css";
import { apiUrl } from "../utils/apiUrl";

const Signup = () => {
   const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "", role: "user" });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState("");

   const handleChange = (e) => {
	   setForm({ ...form, [e.target.name]: e.target.value });
   };

   const handleSubmit = async (e) => {
	   e.preventDefault();
	   
	   // Validate password confirmation
	   if (form.password !== form.confirmPassword) {
		   setError("Passwords do not match");
		   return;
	   }
	   
	   if (form.password.length < 6) {
		   setError("Password must be at least 6 characters long");
		   return;
	   }
	   
	   setLoading(true);
	   setError("");
	   try {
		   // Remove confirmPassword from the data sent to server
		   const { confirmPassword, ...signupData } = form;
		   
		   console.log("Sending signup data:", signupData);
		   
		   const res = await fetch(apiUrl("/api/auth/signup"), {
			   method: "POST",
			   headers: { "Content-Type": "application/json" },
			   body: JSON.stringify(signupData),
		   });
		   
		   console.log("Response status:", res.status);
		   const data = await res.json();
		   console.log("Response data:", data);
		   
		   if (!res.ok) {
			   // Handle specific error cases
			   if (res.status === 409) {
				   setError("This email is already registered. Please try logging in instead.");
			   } else if (res.status === 400) {
				   setError(data.message || "Please check your input and try again.");
			   } else {
				   setError(data.message || "Signup failed. Please try again.");
			   }
			   return;
		   }
		   
		   // Verify we received the required data
		   if (!data.token || !data.user) {
			   console.error("Missing token or user data:", data);
			   setError("Signup successful but login failed. Please try logging in manually.");
			   return;
		   }
		   
		   console.log("Storing token and user data...");
		   // Auto-login after successful signup (professional UX)
		   localStorage.setItem("token", data.token);
		   localStorage.setItem("user", JSON.stringify(data.user));
		   
		   console.log("Redirecting to:", data.user.role === "admin" ? "/admin" : "/home");
		   // Redirect to appropriate page based on role
		   window.location.href = data.user.role === "admin" ? "/admin" : "/home";
	   } catch (err) {
		   console.error("Signup error:", err);
		   setError("Network error. Please check your connection and try again.");
	   } finally {
		   setLoading(false);
	   }
   };

			return (
				<div className="home-landing" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
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
						<h2 className="gradient-text mb-4" style={{ fontWeight: 'bold', fontSize: '2.5rem', textAlign: 'center' }}>Sign Up</h2>
						<button
							type="button"
							className="btn w-100 mb-3"
							style={{
								background: '#fff',
								color: '#333',
								fontWeight: 'bold',
								border: '1px solid #e0e0e0',
								boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '10px',
								position: 'relative',
								overflow: 'hidden'
							}}
							onClick={() => alert('Google signup is not yet implemented.')}
						>
							<span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
								<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '22px', height: '22px', background: 'transparent' }} />
								Sign up with Google
							</span>
						</button>
						<div style={{ display: 'flex', alignItems: 'center', margin: '18px 0' }}>
							<hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0e0e0' }} />
							<span style={{ color: '#fff', margin: '0 12px', fontWeight: 'bold' }}>or</span>
							<hr style={{ flex: 1, border: 'none', borderTop: '1px solid #e0e0e0' }} />
						</div>
						<form onSubmit={handleSubmit}>
							<div className="mb-3">
								<label htmlFor="name" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Name</label>
								<input type="text" className="form-control" id="name" name="username" value={form.username} onChange={handleChange} placeholder="Enter your name" required />
							</div>
							<div className="mb-3">
								<label htmlFor="email" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Email address</label>
								<input type="email" className="form-control" id="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email" required />
							</div>
							<div className="mb-3">
								<label htmlFor="password" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Password</label>
								<input type="password" className="form-control" id="password" name="password" value={form.password} onChange={handleChange} placeholder="Password" minLength="6" required />
							</div>
							<div className="mb-4">
								<label htmlFor="confirmPassword" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Confirm Password</label>
								<input type="password" className="form-control" id="confirmPassword" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm Password" required />
							</div>
							<div className="mb-4">
								<label htmlFor="role" className="form-label" style={{ color: '#fff', fontWeight: 'bold' }}>Role</label>
								<select className="form-control" id="role" name="role" value={form.role} onChange={handleChange} required>
									<option value="user">User</option>
									<option value="admin">Admin</option>
								</select>
							</div>
							{error && <div className="alert alert-danger py-2">{error}</div>}
							<button type="submit" className="btn w-100 py-2" style={{ fontWeight: 'bold', fontSize: '1.1rem', backgroundColor: '#ff6600', borderColor: '#ff6600', color: 'white' }} disabled={loading}>{loading ? 'Signing Up...' : 'Sign Up'}</button>
						</form>
						<div className="mt-4 text-center">
							<span style={{ color: '#fff' }}>Already have an account?</span>
							<a href="/login" className="ms-2" style={{ color: '#ff6a00', fontWeight: 'bold', textDecoration: 'underline' }}>Login</a>
						</div>
					</div>
				</div>
			);
}

export default Signup;
