'use client';

import { useState } from 'react';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChevronDown, Lock, Database, Shield, Mail } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  badge: string;
  icon: React.ReactNode;
  content: string;
  dataPoints?: Array<{ label: string; description: string }>;
  items?: string[];
}

const sections: Section[] = [
  {
    id: 'introduction',
    title: 'Introduction',
    badge: 'Overview',
    icon: <Shield size={20} />,
    content: 'Welcome to NANONI Studio. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website (regardless of where you visit it from) and tell you about your privacy rights and how the law protects you.',
  },
  {
    id: 'data-collection',
    title: 'Data We Collect',
    badge: 'Important',
    icon: <Database size={20} />,
    content: 'We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:',
    dataPoints: [
      {
        label: 'Identity Data',
        description: 'includes first name, last name, username or similar identifier.'
      },
      {
        label: 'Contact Data',
        description: 'includes email address and telephone numbers.'
      },
      {
        label: 'Technical Data',
        description: 'includes internet protocol (IP) address, your login data, browser type and version.'
      },
      {
        label: 'Usage Data',
        description: 'includes information about how you use our website, products and services.'
      },
    ]
  },
  {
    id: 'data-usage',
    title: 'How We Use Your Data',
    badge: 'Legal',
    icon: <Mail size={20} />,
    content: 'We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:',
    items: [
      'Where we need to perform the contract we are about to enter into or have entered into with you.',
      'Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.',
      'Where we need to comply with a legal obligation.',
    ]
  },
  {
    id: 'data-security',
    title: 'Data Security',
    badge: 'Critical',
    icon: <Lock size={20} />,
    content: 'We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed. All information is encrypted and secured with industry-leading protocols.',
  },
  {
    id: 'contact',
    title: 'Contact Us',
    badge: 'Support',
    icon: <Mail size={20} />,
    content: 'If you have any questions about this privacy policy or our privacy practices, please contact us at hello@nanoni.studio. We\'re committed to addressing your concerns promptly and transparently.',
  },
];

const badgeStyles = {
  Overview: 'bg-purple/20 text-purple border border-purple/40',
  Important: 'bg-orange/20 text-orange border border-orange/40',
  Legal: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
  Critical: 'bg-red-500/20 text-red-400 border border-red-500/40',
  Support: 'bg-green-500/20 text-green-400 border border-green-500/40',
};

function AccordionSection({ section, idx }: { section: Section; idx: number }) {
  const [isOpen, setIsOpen] = useState(idx === 0);

  return (
    <div
      id={section.id}
      className="group relative mb-4 transition-all duration-300 scroll-mt-32"
      style={{
        animation: `fadeIn 0.5s ease-out ${idx * 100}ms forwards`,
        opacity: 0,
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass w-full p-6 rounded-xl flex items-center justify-between hover:bg-white/5 transition-all duration-300 group-hover:border-purple/40"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="text-purple opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            {section.icon}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple to-pink-500 bg-clip-text text-transparent">
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
          className={`flex-shrink-0 text-purple transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="glass p-6 rounded-xl space-y-4">
            <p className="text-soft-gray leading-relaxed">
              {section.content}
            </p>

            {/* Data Points - Horizontal Scroll */}
            {section.dataPoints && section.dataPoints.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-foreground mb-3">Data Categories:</p>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-3 min-w-min pr-2">
                    {section.dataPoints.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple/40 transition-all duration-300 hover:bg-purple/5 min-w-[240px]"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-purple flex-shrink-0 mt-1.5"></div>
                            <p className="font-semibold text-sm text-foreground">
                              {item.label}
                            </p>
                          </div>
                          <p className="text-xs text-soft-gray leading-relaxed ml-4">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Items List - Horizontal Scroll */}
            {section.items && section.items.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-semibold text-foreground mb-3">Use Cases:</p>
                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-3 min-w-min pr-2">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 bg-white/5 border border-white/10 rounded-lg p-4 hover:border-purple/40 transition-all duration-300 hover:bg-purple/5 min-w-[280px]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple flex-shrink-0 mt-2"></div>
                          <p className="text-sm text-soft-gray leading-relaxed">
                            {item}
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
        <div className="w-1 h-1 rounded-full bg-purple"></div>
        Quick Navigation
      </h3>
      <nav className="space-y-2">
        {sections.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="block text-sm text-soft-gray hover:text-purple transition-colors duration-200 pl-3 py-1.5 border-l border-white/10 hover:border-purple/40 hover:bg-white/5 rounded-r"
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

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-32 pb-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="inline-block">
                <span className="text-xs font-semibold px-4 py-1.5 rounded-full bg-purple/10 text-purple border border-purple/40">
                  Last Updated: March 2026
                </span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple via-pink-500 to-purple bg-clip-text text-transparent">
                Privacy Policy
              </h1>
              <p className="text-lg text-soft-gray max-w-2xl leading-relaxed">
                Your privacy matters to us. Learn how we collect, use, and protect your data at NANONI Studio.
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
                <AccordionSection key={section.id} section={section} idx={idx} />
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-16 glass p-8 rounded-xl text-center group hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-purple/40">
            <h3 className="text-xl font-bold mb-3">Your Privacy Concerns Matter</h3>
            <p className="text-soft-gray mb-4">
              Have questions about how we handle your data?{' '}
              <a
                href="mailto:hello@nanoni.studio"
                className="text-purple hover:text-pink-500 transition-colors duration-300 font-semibold hover:underline"
              >
                Get in touch
              </a>
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔒', label: 'End-to-End Encrypted', desc: 'Your data is protected with industry standards' },
              { icon: '🛡️', label: 'GDPR Compliant', desc: 'We follow all international privacy regulations' },
              { icon: '✅', label: 'Transparent', desc: 'We clearly communicate how we use your data' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="glass p-4 rounded-lg text-center hover:border-purple/40 transition-all duration-300 hover:bg-white/5"
              >
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className="font-semibold text-sm mb-1">{item.label}</p>
                <p className="text-xs text-soft-gray">{item.desc}</p>
              </div>
            ))}
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
