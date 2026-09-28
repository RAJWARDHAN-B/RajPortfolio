const Footer = () => {
  const links = [
    [
      { label: "GitHub", href: "https://github.com/RAJWARDHAN-B", external: true },
      { label: "LinkedIn", href: "https://linkedin.com/in/rajwardhan-bhandigare", external: true },
      { label: "Email", href: "mailto:rajwardhanpict@gmail.com", external: true },
    ],
    [
      { label: "About", href: "#about" },
      { label: "Projects", href: "#projects" },
      { label: "Experience", href: "#experience" },
    ],
    [
      { label: "Résumé", href: "/Rajwardhan_Ashok_Bhandigare.pdf", external: true },
      { label: "Certifications", href: "#certifications" },
      { label: "Contact", href: "#contact" },
    ],
  ];

  return (
    <footer className="px-4 md:px-12 py-12 border-t border-border">
      <div className="max-w-6xl">
        <p className="text-muted-foreground text-sm mb-6">
          Questions? Reach out at{" "}
          <a href="mailto:rajwardhanpict@gmail.com" className="hover:underline">
            rajwardhanpict@gmail.com
          </a>
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {links.map((column, i) => (
            <ul key={i} className="space-y-2">
              {column.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {link.label}
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
