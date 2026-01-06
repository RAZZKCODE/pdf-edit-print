import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  step: number;
  delay?: number;
}

const FeatureCard = ({ icon: Icon, title, description, step, delay = 0 }: FeatureCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="relative group"
    >
      <div className="bg-card rounded-2xl border border-border p-6 h-full transition-all duration-300 hover:shadow-lg hover:border-accent/30 hover:-translate-y-1">
        {/* Step number */}
        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-accent-foreground font-bold text-sm shadow-md">
          {step}
        </div>
        
        {/* Icon */}
        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-7 h-7 text-primary" />
        </div>
        
        {/* Content */}
        <h3 className="font-display font-semibold text-lg text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
};

export default FeatureCard;
