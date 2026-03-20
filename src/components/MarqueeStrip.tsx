const ITEMS = [
  "Face Swap", "Brand DNA", "Relight", "PostFlow", "AI Upscaler",
  "Style Fusion", "Cloth Swap", "Storyboard", "Ad Pack",
  "Camera Simulator", "Object Remover", "Image Extend",
  "Hair Swap", "Vibe Swap", "Color Gradient", "AI Generate",
  "Skin Enhancement", "Brush Edit", "Angles Edit",
];

const Row = ({ reverse = false }: { reverse?: boolean }) => {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden mask-fade-x group">
      <div
        className={`flex whitespace-nowrap ${reverse ? "animate-marquee-reverse" : "animate-marquee"} group-hover:[animation-play-state:paused]`}
      >
        {doubled.map((item, i) => (
          <span key={i} className={`mx-5 text-base font-medium tracking-wide ${i % 2 === 0 ? "text-orange" : "text-purple"}`}>
            {item} <svg width="5" height="5" viewBox="0 0 5 5" fill="currentColor" className="inline mx-2 text-soft-gray/30" aria-hidden="true"><circle cx="2.5" cy="2.5" r="2"/></svg>
          </span>
        ))}
      </div>
    </div>
  );
};

export const MarqueeStrip = () => (
  <div className="py-6 space-y-3 border-b border-border">
    <Row />
    <Row reverse />
  </div>
);
