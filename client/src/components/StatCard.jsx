import { cn } from '../utils/cn';
import AnimatedCounter from './AnimatedCounter';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, description, className, index = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "glass-card p-6 flex flex-col justify-between relative overflow-hidden group border border-slate-200/50 shadow-premium", 
        className
      )}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary-500/10 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-primary-500 group-hover:bg-primary-50 transition-all duration-300 border border-slate-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="mt-6 relative z-10">
        <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
          <AnimatedCounter value={value} />
        </p>
        {description && (
          <p className="mt-2 text-xs text-slate-500 font-semibold">{description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
