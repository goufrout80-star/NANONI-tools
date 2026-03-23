'use client';

import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChevronDown } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  badge: string;
  content: string;
  restrictions?: string[];
}

const sections: Section[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    badge: 'Essential',
    content: 'By accessing or using NANONI Studio, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.',
  },
  {
    id: 'license',
    title: 'Use License',
    badge: 'Important',
    content: 'Permission is granted to temporarily download one copy of the materials (information or software) on NANONI Studio\'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:',
    restrictions: [
      'modify or copy the materials',
      'use the materials for any commercial purpose, or for any public display (commercial or non-commercial)',
      'attempt to decompile or reverse engineer any software contained on NANONI Studio\'s website',
      'remove any copyright or other proprietary notations from the materials',
      'transfer the materials to another person or "mirror" the materials on any other server'
    ]
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    badge: 'Legal',
    content: 'The materials on NANONI Studio\'s website are provided on an \'as is\' basis. NANONI Studio makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
  },
  {
    id: 'limitations',
    title: 'Limitations',
    badge: 'Legal',
    content: 'In no event shall NANONI Studio or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on NANONI Studio\'s website.',
  },
  {
    id: 'revisions',
    title: 'Revisions',
    badge: 'Updates',
    content: 'NANONI Studio may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.',
  },
];

const badgeStyles = {
  Essential: 'bg-orange/20 text-orange border border-orange/40',
  Important: 'bg-purple/20 text-purple border border-purple/40',
  Legal: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  Updates: 'bg-green-500/20 text-green-400 border border-green-500/40',
};

function AccordionSection({ section }: { section: Section }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      id={section.id}
      className="group relative mb-4 transition-all duration-300 scroll-mt-32"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass w-full p-6 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all duration-300 group-hover:border-orange/40"
      >
        <div className="flex items-center gap-4 text-left">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange to-purple bg-clip-text text-transparent">
                {section.title}
              </h3>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-300 ${badgeStyles[section.badge as keyof typeof badgeStyles]}`}>
                {section.badge}
              </span>
            </div>
            {!isOpen && (
              <p className="text-sm text-soft-gray line-clamp-1">
                {section.content}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          size={20}
          className={`flex-shrink-0 text-orange transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="glass p-6 rounded-xl space-y-4">
            <p className="text-soft-gray leading-relaxed">
              {section.content}
            </p>
            {section.restrictions && section.restrictions.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold text-foreground mb-3">Restrictions:</p>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-min pr-2">
                    {section.restrictions.map((restriction, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg p-3 hover:border-orange/40 transition-all duration-300 hover:bg-orange/5 min-w-[200px]"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange flex-shrink-0 mt-1.5"></div>
                          <p className="text-sm text-soft-gray">
                            {restriction}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TableOfContents() {
  return (
    <div className="glass sticky top-32 p-6 rounded-xl h-fit hidden lg:block">
      <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <div className="w-1 h-1 rounded-full bg-orange"></div>
        Quick Navigation
      </h3>
      <nav className="space-y-2">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="block text-sm text-soft-gray hover:text-orange transition-colors duration-200 pl-3 py-1.5 border-l border-white/10 hover:border-orange/40 hover:bg-white/5 rounded-r"
          >
            {section.title}
          </a>
        ))}
      </nav>
      <div className="mt-6 pt-6 border-t border-white/10">
        <p className="text-xs text-soft-gray">
          Last updated: March 2026
        </p>
      </div>
    </div>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-orange/10 text-orange border border-orange/40">
                  Last Updated: March 2026
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-orange via-purple to-orange bg-clip-text text-transparent">
                Terms of Service
              </h1>
              <p className="text-lg text-soft-gray max-w-2xl leading-relaxed">
                Please read these terms carefully. By accessing or using NANONI Studio, you agree to comply with all terms outlined below.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar TOC */}
            <div className="lg:col-span-1">
              <TableOfContents />
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {sections.map((section, idx) => (
                <div
                  key={section.id}
                  style={{
                    animation: `fadeIn 0.5s ease-out ${idx * 100}ms forwards`,
                    opacity: 0,
                  }}
                  className="animate-in fade-in"
                >
                  <AccordionSection section={section} />
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 glass p-8 rounded-xl text-center group hover:bg-white/5 transition-all duration-300">
            <h3 className="text-xl font-bold mb-3">Questions about our Terms?</h3>
            <p className="text-soft-gray mb-4">
              Contact us at{' '}
              <a
                href="mailto:hello@nanoni.studio"
                className="text-orange hover:text-purple transition-colors duration-300 font-semibold hover:underline"
              >
                hello@nanoni.studio
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
