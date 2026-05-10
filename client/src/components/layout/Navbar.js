// src/components/layout/Navbar.js
import React, { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const userRoles = Array.isArray(profile?.roles) && profile.roles.length > 0
    ? profile.roles
    : [profile?.role || "author"];

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/editorial-board", label: "Editorial Board" },
    { to: "/call-for-papers", label: "Call for Papers" },
    { to: "/author-guidelines", label: "Author Guidelines" },
    { to: "/archives", label: "Archives" },
    { to: "/contact", label: "Contact" },
    { to: "/dashboard", label: "Dashboard" },
  ];

  const activeClass = "text-blue-700 font-semibold border-b-2 border-blue-700";
  const inactiveClass = "text-gray-700 hover:text-blue-700 transition-colors duration-150";

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-blue-900 text-white text-xs py-1 px-4 flex justify-between items-center">
        <span>ISSN (Online): 2XXX-XXXX</span>
        <span>Impact Factor: 4.52</span>
      </div>

      {/* Main navbar */}
      <div className="w-full px-6 lg:px-10">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Journal Name */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/assets/logo.png" 
              alt={process.env.REACT_APP_JOURNAL_ABBR || "IJEEQT"} 
              className="w-32 h-16 sm:w-40 sm:h-20 object-contain"
            />
            <div className="hidden sm:block">
              <p className="text-blue-900 font-bold text-sm leading-tight">
                {process.env.REACT_APP_JOURNAL_NAME || "International Journal of Engineering Excellence in Quantum Technology"}
              </p>
              <p className="text-gray-500 text-xs">A Peer-Reviewed Open Access Journal</p>
            </div>
          </Link>

          {/* Desktop Nav & Auth Wrapper — pushed to the right end */}
          <div className="hidden xl:flex items-center gap-6 ml-auto">
            {/* Desktop nav */}
            <nav className="flex items-center gap-4 text-sm">
              {navLinks.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === "/"}
                  className={({ isActive }) => isActive ? activeClass : inactiveClass}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>

            {/* Auth section */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-700"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-semibold text-xs">
                      {profile?.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <span className="max-w-[120px] truncate">{profile?.name || user.email}</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {dropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50"
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-900 truncate">{profile?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                      </div>
                      <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                        Dashboard
                      </Link>
                      <Link to="/submit-paper" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setDropdownOpen(false)}>
                        Submit Paper
                      </Link>
                      {userRoles.includes("admin") && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-blue-700 hover:bg-gray-50 font-medium" onClick={() => setDropdownOpen(false)}>
                          🛡️ Admin Panel
                        </Link>
                      )}
                      {userRoles.includes("editor") && (
                        <Link to="/editor" className="block px-4 py-2 text-sm text-purple-700 hover:bg-gray-50 font-medium" onClick={() => setDropdownOpen(false)}>
                          📝 Editor Panel
                        </Link>
                      )}
                      {userRoles.some(r => ["admin", "manager"].includes(r)) && (
                        <Link to="/site-content" className="block px-4 py-2 text-sm text-blue-700 hover:bg-gray-50 font-medium" onClick={() => setDropdownOpen(false)}>
                          ⚙️ Site Content
                        </Link>
                      )}
                      {userRoles.includes("reviewer") && (
                        <Link to="/reviewer" className="block px-4 py-2 text-sm text-emerald-700 hover:bg-gray-50 font-medium" onClick={() => setDropdownOpen(false)}>
                          🔍 Reviewer Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm text-blue-700 font-medium hover:text-blue-900 whitespace-nowrap"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-700 text-white text-sm px-4 py-2 rounded hover:bg-blue-800 transition-colors whitespace-nowrap"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="xl:hidden p-2 rounded text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="xl:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-2">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `block py-2 text-sm ${isActive ? "text-blue-700 font-semibold" : "text-gray-700"}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
          <div className="pt-2 border-t border-gray-100 flex gap-3">
            {user ? (
              <button onClick={handleLogout} className="text-sm text-red-600">Sign Out</button>
            ) : (
              <>
                <Link to="/login" className="text-sm text-blue-700" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="text-sm bg-blue-700 text-white px-3 py-1 rounded" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
