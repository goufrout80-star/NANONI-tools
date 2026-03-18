const ITEMS = [
  "Face Swap", "Brand DNA", "Relight", "PostFlow", "AI Upscaler",
  "Style Fusion", "Cloth Swap", "Storyboard", "Ad Pack",
  "Camera Simulator", "Object Remover", "Image Extend",
  "Hair Swap", "Vibe Swap", "Color Gradient", "AI Generate",
];

export const MarqueeStrip = () => {
  const doubled = [...ITEMS, ...ITEMS];
  return (
    <div className="overflow-hidden py-6 border-b border-border">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span key={i} className={`mx-6 text-lg font-medium tracking-wide ${i % 2 === 0 ? "text-orange" : "text-muted-foreground"}`}>
            {item} •
          </span>
        ))}
      </div>
    </div>
  );
};
