import { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { cn } from '../utils/cn';
import { useTheme } from 'next-themes';
import './Calendar.css'; // Custom overrides for styling

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function InteractiveCalendar({ events = [], onSelectEvent }) {
  const { theme } = useTheme();
  
  // Format our appointments into react-big-calendar events
  const calendarEvents = events.map(apt => {
    // Basic string parsing to construct start/end dates
    // Assuming appointmentDate is yyyy-MM-dd and timeSlot is like "09:00 AM"
    const dateStr = format(new Date(apt.appointmentDate), 'yyyy-MM-dd');
    const timeMatch = apt.timeSlot.match(/(\d+):(\d+)\s+(AM|PM)/);
    
    let startHour = 9;
    let startMin = 0;
    
    if (timeMatch) {
      startHour = parseInt(timeMatch[1]);
      startMin = parseInt(timeMatch[2]);
      if (timeMatch[3] === 'PM' && startHour < 12) startHour += 12;
      if (timeMatch[3] === 'AM' && startHour === 12) startHour = 0;
    }

    const start = new Date(dateStr);
    start.setHours(startHour, startMin, 0);

    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30); // Assume 30 min appointments

    return {
      id: apt._id,
      title: `${apt.patient?.name || 'Patient'} - ${apt.reason}`,
      start,
      end,
      resource: apt,
    };
  });

  const eventStyleGetter = (event, start, end, isSelected) => {
    const apt = event.resource;
    let backgroundColor = '#38bdf8'; // Default primary
    
    if (apt.status === 'confirmed') backgroundColor = '#34d399'; // emerald
    if (apt.status === 'requested') backgroundColor = '#fbbf24'; // amber
    if (apt.status === 'completed') backgroundColor = '#60a5fa'; // blue
    if (apt.status === 'cancelled') backgroundColor = '#fb7185'; // rose

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: '#fff',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '2px 6px'
      }
    };
  };

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 h-[600px] w-full", theme === 'dark' ? 'dark-calendar' : '')}>
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', width: '100%' }}
        onSelectEvent={onSelectEvent}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day']}
        defaultView="month"
      />
    </div>
  );
}
