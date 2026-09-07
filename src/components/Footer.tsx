import React from 'react';
import { Linkedin, Github, Instagram, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative w-full z-20 shrink-0 border-t border-[#3a2213] bg-[#140a05]/95 backdrop-blur-xs py-1 px-3 sm:px-6 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px] sm:text-xs font-mono">
        {/* Left: Copyright Credit */}
        <div className="flex items-center gap-1.5 text-[#bfa07d]">
          <span className="text-[#e5bf7d] font-serif font-bold tracking-wide">अपना रेडियो</span>
          <span className="text-[#6d4e2a]">•</span>
          <span className="text-[#a88a68]">Created by</span>
          <a
            href="https://nitishkhobragade.github.io/portfolio.nitish/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#fce5c0] font-semibold hover:text-[#fbbf24] transition-colors underline decoration-[#6d4e2a] hover:decoration-[#fbbf24]"
          >
            Nitish Khobragade
          </a>
        </div>

        {/* Right: Social Media Profiles */}
        <div className="flex items-center gap-2 sm:gap-3 text-[#bfa07d]">
          <a
            href="https://in.linkedin.com/in/nitishkhobragade"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn Profile"
            className="p-1 rounded hover:text-[#60a5fa] hover:bg-[#26150a] transition-all hover:scale-110"
          >
            <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>

          <a
            href="https://github.com/nitishkhobragade/"
            target="_blank"
            rel="noopener noreferrer"
            title="GitHub Profile"
            className="p-1 rounded hover:text-[#f3f4f6] hover:bg-[#26150a] transition-all hover:scale-110"
          >
            <Github className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>

          <a
            href="https://www.instagram.com/nitish_khobragade"
            target="_blank"
            rel="noopener noreferrer"
            title="Instagram Profile"
            className="p-1 rounded hover:text-[#f43f5e] hover:bg-[#26150a] transition-all hover:scale-110"
          >
            <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </a>

          <a
            href="https://nitishkhobragade.github.io/portfolio.nitish/"
            target="_blank"
            rel="noopener noreferrer"
            title="Portfolio"
            className="p-1 rounded hover:text-[#fbbf24] hover:bg-[#26150a] transition-all hover:scale-110 flex items-center gap-1"
          >
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#e5bf7d]" />
            <span className="text-[10px] hidden md:inline text-[#e5bf7d]">Portfolio</span>
          </a>
        </div>
      </div>
    </footer>
  );
};
