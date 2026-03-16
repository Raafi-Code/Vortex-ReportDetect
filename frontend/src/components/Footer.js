"use client";

import { useLanguage } from "@/contexts/language-context";

export default function Footer() {
  const { text, language } = useLanguage();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section footer-copyright">
          <p>{text.footer.copyright}</p>
        </div>

        <div className="footer-dot"></div>

        <div className="footer-section footer-developed">
          <p>
            {text.footer.developedBy}{" "}
            <a
              href="https://www.linkedin.com/in/muhammad-rafi17/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Muhammad Rafi
            </a>
          </p>
        </div>

        <div className="footer-divider">|</div>

        <div className="footer-section footer-ryurex">
          <a
            href="https://ryurex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-ryurex-link"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/ryurex-logo.png"
              alt="Ryurex Logo"
              className="footer-ryurex-logo"
            />
            <span>Ryurex Corporation</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
