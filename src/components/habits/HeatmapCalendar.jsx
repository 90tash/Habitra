import React from 'react';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function HeatmapCalendar({ logs = [], weeks = 12 }) {
  const today = new Date();
  const totalDays = weeks * 7;
  const startDate = startOfWeek(subDays(today, totalDays - 1), { weekStartsOn: 1 });

  const dateMap = {};
  logs.forEach(log => {
    const d = log.date;
    if (!dateMap[d]) dateMap[d] = { total: 0, completed: 0 };
    dateMap[d].total++;
    if (log.is_completed) dateMap[d].completed++;
  });

  const cells = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const data = dateMap[dateStr];
    const isFuture = date > today;
    let intensity = 0;
    if (data && data.total > 0) intensity = Math.ceil((data.completed / data.total) * 4);
    cells.push({ date, dateStr, intensity, isFuture, data });
  }

  const weekColumns = [];
  for (let i = 0; i < cells.length; i += 7) weekColumns.push(cells.slice(i, i + 7));

  const dayLabels = ['M', '', 'W', '', 'F', '', ''];

  const intensityStyle = (intensity, isFuture) => {
    if (isFuture) return { background: 'transparent' };
    if (intensity === 0) return { background: 'hsl(var(--muted)/0.6)' };
    const opacities = ['', '0.25', '0.45', '0.65', '0.9'];
    return { background: `hsl(var(--primary)/${opacities[intensity]})` };
  };

  return (
    <div className="glass rounded-2xl p-4 card-shadow border border-border/30">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-primary inline-block" />
        Activity
      </h3>
      <div className="flex gap-[3px]">
        <div className="flex flex-col gap-[3px] mr-1.5 pt-[2px]">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[12px] w-3 text-[8px] text-muted-foreground flex items-center">{label}</div>
          ))}
        </div>
        <TooltipProvider>
          <div className="flex gap-[3px] overflow-x-auto">
            {weekColumns.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => (
                  <Tooltip key={di}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: (wi * 7 + di) * 0.002, type: 'spring', stiffness: 400, damping: 30 }}
                        className="h-[12px] w-[12px] rounded-[3px] cursor-default transition-transform hover:scale-125"
                        style={intensityStyle(cell.intensity, cell.isFuture)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs rounded-xl">
                      <p className="font-medium">{format(cell.date, 'MMM d, yyyy')}</p>
                      {cell.data
                        ? <p className="text-muted-foreground">{cell.data.completed}/{cell.data.total} done</p>
                        : <p className="text-muted-foreground">No data</p>
                      }
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[9px] text-muted-foreground">Less</span>
        {[0,1,2,3,4].map(i => (
          <div key={i} className="h-[9px] w-[9px] rounded-[2px]" style={intensityStyle(i, false)} />
        ))}
        <span className="text-[9px] text-muted-foreground">More</span>
      </div>
    </div>
  );
}