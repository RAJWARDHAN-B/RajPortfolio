const Footer = () => {
  const links = [
    ["GitHub", "LinkedIn", "Twitter", "Blog"],
    ["About", "Projects", "Experience", "Contact"],
    ["Resume", "Certifications", "Testimonials", "FAQ"],
    ["Privacy", "Terms", "Sitemap", "RSS"],
  ];

  return (
    <footer className="px-4 md:px-12 py-12 border-t border-border">
      <div className="max-w-6xl">
        <p className="text-muted-foreground text-sm mb-6">
          Questions? Reach out at{" "}
          <a href="mailto:rajwardhan@example.com" className="hover:underline">
            john@example.com
          </a>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {links.map((col, i) => (
            <ul key={i} className="space-y-2">
              {col.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          © 2026 Rajwardhan. Built with React & Tailwind CSS.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
