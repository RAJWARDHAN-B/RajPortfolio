import { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";

const navItems = ["Home", "About", "Projects", "Experience", "3D Mode", "Contact"];

const NetflixNav = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const normalized = id.toLowerCase().replace(/\s+/g, "-");
    const el = document.getElementById(normalized);
    el?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  return (
    <nav
      className={`netflix-nav ${scrolled ? "netflix-nav-scrolled" : "netflix-nav-transparent"
        }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-3">
        <div className="flex items-center gap-8">
          <img
            src="/Rnetflixfulltext.png"
            alt="RAJWARDHAN"
            className="h-8 md:h-10 cursor-pointer object-contain"
            onClick={() => scrollTo("home")}
          />

          {/* Desktop nav */}
          <ul className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onClick={() => scrollTo(item)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <Search className="w-5 h-5 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
          <Bell className="w-5 h-5 text-foreground cursor-pointer hover:text-muted-foreground transition-colors" />
          <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center cursor-pointer">
            <img
              src="/Rnetflixicon.png"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col gap-1"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className={`w-5 h-0.5 bg-foreground transition-transform ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`w-5 h-0.5 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`w-5 h-0.5 bg-foreground transition-transform ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-netflix-dark/95 backdrop-blur-sm border-t border-border">
          <ul className="flex flex-col py-4">
            {navItems.map((item) => (
              <li key={item}>
                <button
                  onClick={() => scrollTo(item)}
                  className="w-full text-left px-8 py-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
};

export default NetflixNav;
