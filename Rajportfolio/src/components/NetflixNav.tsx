import { useState, useEffect, useRef } from "react";
import { Search, Bell, X, FileText, Download, User as UserIcon, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = ["Home", "About", "Projects", "Experience", "TechStack", "Languages", "Contact"];

const NetflixNav = ({ onSearch }: { onSearch?: (query: string) => void }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

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
          {/* Search Bar */}
          <div
            className={`flex items-center transition-all duration-300 ${searchOpen ? "bg-black/80 border border-white px-2 py-1" : ""
              }`}
          >
            <Search
              className="w-5 h-5 text-foreground cursor-pointer hover:text-muted-foreground transition-colors"
              onClick={() => {
                setSearchOpen(!searchOpen);
                if (!searchOpen) {
                  setTimeout(() => searchInputRef.current?.focus(), 100);
                } else if (!searchQuery) {
                  // If closing and empty query, close it and clear
                  setSearchQuery("");
                  onSearch?.("");
                }
              }}
            />
            {searchOpen && (
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="Titles, skills, categories"
                className="bg-transparent text-white focus:outline-none text-sm ml-2 w-32 md:w-48 transition-all"
                onBlur={() => {
                  if (!searchQuery) {
                    setSearchOpen(false);
                  }
                }}
              />
            )}
            {searchOpen && searchQuery && (
              <X
                className="w-4 h-4 text-muted-foreground cursor-pointer ml-1 hover:text-white"
                onClick={() => {
                  setSearchQuery("");
                  onSearch?.("");
                  searchInputRef.current?.focus();
                }}
              />
            )}
          </div>

          <Bell className="w-5 h-5 text-foreground cursor-pointer hover:text-muted-foreground transition-colors hidden sm:block" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-8 h-8 rounded overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-110">
                <img
                  src="/Rnetflixicon.png"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
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
              <DropdownMenuSeparator className="bg-neutral-800" />
              <DropdownMenuItem className="cursor-pointer hover:bg-white/10 flex items-center gap-2 opacity-50 cursor-not-allowed">
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Portfolio</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
