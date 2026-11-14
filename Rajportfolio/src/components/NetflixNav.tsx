import { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Download, User as UserIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = ["Home", "About", "Projects", "Experience", "Certifications", "TechStack", "Languages", "Contact"];

const NetflixNav = ({ onSearch }: { onSearch?: (query: string) => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!pendingTarget || searchQuery) return;
    const frame = requestAnimationFrame(() => {
      document.getElementById(pendingTarget)?.scrollIntoView({ behavior: "smooth" });
      setPendingTarget(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingTarget, searchQuery]);

  const scrollTo = (id: string) => {
    const normalized = id.toLowerCase().replace(/\s+/g, "-");
    if (searchQuery) {
      setSearchQuery("");
      onSearch?.("");
    }
    setPendingTarget(normalized);
    setMobileOpen(false);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    onSearch?.("");
    searchButtonRef.current?.focus();
  };

  return (
    <nav
      className={`netflix-nav ${scrolled ? "netflix-nav-scrolled" : "netflix-nav-transparent"
        }`}
    >
      <div className="flex items-center justify-between px-4 md:px-12 py-3">
        <div className="flex items-center gap-8">
          <button
            type="button"
            aria-label="Go to home"
            onClick={() => scrollTo("home")}
            className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <img src="/Rnetflixfulltext.png" alt="RAJWARDHAN" className="h-8 md:h-10 object-contain" />
          </button>

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
          {/* Search Bar */}
          <div
            className={`flex items-center transition-all duration-300 ${searchOpen ? "bg-black/80 border border-white px-2 py-1" : ""
              }`}
          >
            <button
              ref={searchButtonRef}
              type="button"
              aria-label={searchOpen ? "Close search" : "Open search"}
              aria-expanded={searchOpen}
              aria-controls="portfolio-search"
              className="text-foreground hover:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              onClick={() => {
                if (searchOpen) closeSearch();
                else setSearchOpen(true);
              }}
            >
              <Search className="w-5 h-5" aria-hidden="true" />
            </button>
            {searchOpen && (
              <input
                id="portfolio-search"
                ref={searchInputRef}
                type="search"
                aria-label="Search portfolio"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="Titles, skills, categories"
                className="bg-transparent text-white text-sm ml-2 w-32 md:w-48 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onKeyDown={(event) => {
                  if (event.key === "Escape") closeSearch();
                }}
              />
            )}
            {searchOpen && searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                className="text-muted-foreground ml-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                onClick={() => {
                  setSearchQuery("");
                  onSearch?.("");
                  searchInputRef.current?.focus();
                }}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label="Open profile menu" className="w-8 h-8 rounded overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <img
                  src="/Rnetflixicon.png"
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-netflix-dark/95 backdrop-blur-md border-neutral-800 text-white" align="end">
              <DropdownMenuLabel className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>My Profile</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem
                className="cursor-pointer hover:bg-white/10 flex items-center gap-2"
                onClick={() => window.open("/Rajwardhan_Ashok_Bhandigare.pdf", "_blank")}
              >
                <FileText className="w-4 h-4" />
                <span>View Resume</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-white/10 flex items-center gap-2 text-primary focus:text-primary"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/Rajwardhan_Ashok_Bhandigare.pdf';
                  link.download = 'Rajwardhan_Resume.pdf';
                  link.click();
                }}
              >
                <Download className="w-4 h-4" />
                <span>Download CV</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            className="md:hidden flex flex-col gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        <div id="mobile-navigation" className="md:hidden bg-netflix-dark/95 backdrop-blur-sm border-t border-border">
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
