import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";

interface LoadingScreenProps {
  isLoading: boolean;
}

export const LoadingScreen = ({ isLoading }: LoadingScreenProps) => (
  <AnimatePresence>
    {isLoading && (
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        exit={{ y: "-100%" }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Glow bloom */}
        <motion.div
          className="absolute w-64 h-64 rounded-full"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            background: "radial-gradient(circle, hsla(14,100%,50%,0.15) 0%, hsla(245,100%,71%,0.08) 50%, transparent 70%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Logo className="w-20 h-20" glow />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.3 }}
          className="mt-6 text-sm text-soft-gray tracking-widest uppercase"
        >
          Design Smarter. Brand Faster.
        </motion.p>
      </motion.div>
    )}
  </AnimatePresence>
);
