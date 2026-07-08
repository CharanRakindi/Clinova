import { cn } from '../utils/cn';
import AnimatedCounter from './AnimatedCounter';

const StatCard = ({ title, value, icon: Icon, description, className, index = 0 }) => {
  const delayClass = `animation-delay-${(index + 1) * 100}`;
  
  return (
    <div className={cn(
      "glass-card p-6 flex flex-col justify-between animate-fade-in-up hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group", 
      delayClass,
      className
    )}>
      {/* Decorative gradient blob */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/40 to-transparent blur-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-center justify-between relative z-10">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{title}</h3>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors duration-300 shadow-sm border border-slate-100">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      
      <div className="mt-6 relative z-10">
        <p className="text-4xl font-extrabold text-slate-800 tracking-tight">
          <AnimatedCounter value={value} />
        </p>
        {description && (
          <p className="mt-2 text-sm text-slate-500 font-medium">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
