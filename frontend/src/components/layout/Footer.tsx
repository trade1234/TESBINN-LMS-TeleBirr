import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import Logo from "./Logo";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { label: "Browse Courses", href: "/courses" },
      { label: "For Students", href: "/students" },
      { label: "For Teachers", href: "/teachers" },
      { label: "Pricing", href: "/pricing" },
    ],
    company: [
      { label: "About TESBINN", href: "/about" },
      { label: "TESBINN", href: "/tesbinn" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
    ],
    support: [
      { label: "Help Center", href: "/support" },
      { label: "Contact Us", href: "/contact" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://www.facebook.com/tradeethiopian?mibextid=vk8aRt", label: "Facebook" },
    { icon: Twitter, href: "https://x.com/trade_ethiopia?t=3-KMZLyDiH52mkoOExg1ag&s=09", label: "Twitter" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/tradeethiopia/", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-nav-footer text-primary-foreground">
      <div className="container-wide section-padding py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Logo variant="light" size="lg" />
            <p className="mt-4 text-primary-foreground/70 max-w-sm">
              Empowering learners with world-class training and development. 
              Your journey to excellence starts here.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Mail className="h-4 w-4" />
                <span>contact@tesbinn.com</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <Phone className="h-4 w-4" />
                <span>+251 92 924 3367</span>
              </div>
              <div className="flex items-center gap-3 text-primary-foreground/70">
                <MapPin className="h-4 w-4" />
                <span>Bole Medhanialem Helzer Tower 8th Floor, Addis Ababa, Ethiopia</span>
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {currentYear} TESBINN. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 transition-colors"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
