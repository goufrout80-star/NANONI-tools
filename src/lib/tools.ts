export interface Tool {
  name: string;
  desc: string;
  model: string;
  ring: 'inner' | 'outer';
}

export const TOOLS: Tool[] = [
  { name: "Face Swap V1", desc: "Identity-preserving face replacement", model: "NNN v1", ring: "inner" },
  { name: "Face Swap V2", desc: "Multi-photo profile consistency", model: "NNN v2", ring: "inner" },
  { name: "Vibe Swap", desc: "Era/theme/style transfer", model: "NNN v2", ring: "inner" },
  { name: "Relight", desc: "Parametric lighting control", model: "NNN v2", ring: "inner" },
  { name: "Skin Enhancement", desc: "3-mode skin retouching", model: "NNN v1", ring: "inner" },
  { name: "Cloth Swap", desc: "Clothing replacement with fit control", model: "NNN v2", ring: "inner" },
  { name: "Hair Swap", desc: "Hairstyle replacement", model: "NNN v1", ring: "inner" },
  { name: "Brush Edit", desc: "Mask-based area editing", model: "NNN v2", ring: "inner" },
  { name: "Angles Edit", desc: "3D viewing angle simulation", model: "NNN v2", ring: "outer" },
  { name: "AI Upscaler", desc: "2x/4x upscaling with enhancement", model: "NNN v1", ring: "outer" },
  { name: "Color Gradient", desc: "Color grading & mood transformation", model: "NNN v2", ring: "outer" },
  { name: "Camera Simulator", desc: "Simulates 10+ camera brands", model: "NNN v2", ring: "outer" },
  { name: "Style Fusion", desc: "Content + style reference blending", model: "NNN v2", ring: "outer" },
  { name: "Object Remover", desc: "Semantic inpainting", model: "NNN v1", ring: "outer" },
  { name: "Image Extend", desc: "Outpainting with scene continuation", model: "NNN v2", ring: "outer" },
  { name: "Storyboard Generator", desc: "4-panel narrative storyboards", model: "NNN v2", ring: "outer" },
  { name: "Ad Pack Generator", desc: "Multi-format ad creative generation", model: "NNN v2", ring: "outer" },
  { name: "AI Generate", desc: "Text-to-image generation", model: "NNN v2", ring: "outer" },
  { name: "PostFlow", desc: "Social media visual automation", model: "NNN v2", ring: "outer" },
];
