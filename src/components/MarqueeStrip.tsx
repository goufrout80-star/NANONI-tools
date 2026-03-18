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
            {item} <span className="text-soft-gray/30 mx-2">✦</span>
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
