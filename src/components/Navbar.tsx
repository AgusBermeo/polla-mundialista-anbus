"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";

interface NavbarProps {
  userName?: string | null;
  isAdmin: boolean;
}

export default function Navbar({ userName, isAdmin }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    {
      name: "Inicio",
      href: "/dashboard",
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: "Pronósticos",
      href: "/dashboard/matches",
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      name: "Fases",
      href: "/dashboard/stages",
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      name: "Posiciones",
      href: "/dashboard/leaderboard",
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "Mi perfil",
      href: "/dashboard/profile",
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  if (isAdmin) {
    navItems.push({
      name: "Admin",
      href: "/dashboard/admin",
      icon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    });
  }

  // Helper function to check if item is active
  const isLinkActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <nav className="bg-slate-100 border-b border-gray-200 shadow-2xs relative z-50">
      {/* Primary Top Bar */}
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left Section: Logo and Desktop Menu */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <a href="/dashboard" className="flex items-center gap-2 group">
            <img
              className="object-contain transition-transform group-hover:rotate-6 duration-300"
              src="/logo-anbu-futbol.png"
              alt="Anbus"
              width={25}
              height={50}
            />
            <span className="font-bold text-lg text-cyan-700 bowlby-one tracking-wide">
              Polla Anbus 2026
            </span>
          </a>

          {/* Desktop Navigation (>= 1024px) */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors duration-200 relative py-1 ${
                    active
                      ? "text-cyan-700"
                      : "text-gray-600 hover:text-cyan-600"
                  }`}
                >
                  {item.name}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-700 rounded-full animate-fade-in" />
                  )}
                </a>
              );
            })}
          </div>
        </div>

        {/* Right Section: Desktop User & Logout OR Mobile Menu Toggle */}
        <div className="flex items-center gap-4">
          {/* Desktop Profile & Logout */}
          <div className="hidden lg:flex items-center gap-4">
            <span className="text-sm text-cyan-700 font-semibold">{userName}</span>
            <LogoutButton />
          </div>

          {/* Mobile Menu Toggle Button (< 1024px) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-cyan-700 hover:bg-slate-200/50 transition-colors focus:outline-hidden cursor-pointer"
            aria-label="Toggle Menu"
          >
            {isOpen ? (
              // Close Icon
              <svg className="w-6 h-6 animate-scale-in" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Hamburger Icon
              <svg className="w-6 h-6 animate-scale-in" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown (< 1024px) */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out border-gray-200/50 bg-slate-100/98 backdrop-blur-md ${
          isOpen
            ? "max-h-[500px] border-t opacity-100 visible"
            : "max-h-0 opacity-0 invisible"
        }`}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {/* Navigation Links with Icons */}
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium ${
                    active
                      ? "bg-cyan-50 text-cyan-700 shadow-2xs"
                      : "text-gray-600 hover:bg-slate-200/40 hover:text-cyan-600 hover:translate-x-1"
                  }`}
                >
                  <span className={`${active ? "text-cyan-700" : "text-gray-400 group-hover:text-cyan-600"}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </a>
              );
            })}
          </div>

          {/* User Profile and Logout for Mobile */}
          <div className="border-t border-gray-200 pt-4 pb-2 px-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Usuario</span>
              <span className="text-sm text-cyan-700 font-bold">{userName}</span>
            </div>
            <div className="bg-red-50 hover:bg-red-100 transition-colors px-4 py-2 rounded-xl">
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
