import { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"

function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const navigate = useNavigate()

  const signup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      await axios.post(
        "http://localhost:5002/api/auth/signup",
        { email, password }
      )
      
      localStorage.setItem("email", email)
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#f7f7f7", padding: "12px 4px" }}>
      <div style={{ maxWidth: "400px", width: "100%", margin: "0 auto", padding: "20px" }}>
        <div>
          <h2 style={{ textAlign: "center", fontSize: "24px", fontWeight: "bold", color: "#333" }}>
            Create your account
          </h2>
          <p style={{ textAlign: "center", fontSize: "14px", color: "#666" }}>
            Or{' '}
            <a href="/login" style={{ textDecoration: "none", color: "#337ab7" }}>
              sign in to your existing account
            </a>
          </p>
        </div>
        <div style={{ marginTop: "20px", backgroundColor: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)" }}>
          <form onSubmit={signup}>
            {error && (
              <div style={{ backgroundColor: "#f2dede", padding: "10px", borderRadius: "5px", marginBottom: "10px" }}>
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" style={{ display: "block", marginBottom: "10px" }}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                style={{ width: "100%", padding: "10px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px" }}
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" style={{ display: "block", marginBottom: "10px" }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                style={{ width: "100%", padding: "10px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px" }}
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "10px" }}>
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                style={{ width: "100%", padding: "10px", fontSize: "16px", border: "1px solid #ccc", borderRadius: "5px" }}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "10px", fontSize: "16px", backgroundColor: "#337ab7", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
              >
                {loading ? (
                  <span style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                    <svg style={{ marginRight: "10px" }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  "Create account"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Signup