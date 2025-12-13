// src/utils/calendarUtils.js

export const generateGoogleCalendarLink = (event) => {
  const { title, start, description, location } = event;
  if (!start) return '#';
  
  // Format dates for Google (YYYYMMDD)
  const startDate = start.replace(/-/g, '');
  
  // End date is next day for all-day events
  const dateObj = new Date(start);
  dateObj.setDate(dateObj.getDate() + 1);
  const endDate = dateObj.toISOString().split('T')[0].replace(/-/g, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${startDate}/${endDate}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const downloadICSFile = (event) => {
  const { title, start, description, location } = event;
  if (!start) return;

  const startDate = start.replace(/-/g, '');
  const dateObj = new Date(start);
  dateObj.setDate(dateObj.getDate() + 1);
  const endDate = dateObj.toISOString().split('T')[0].replace(/-/g, '');

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CandyPic//Portfolio//EN
BEGIN:VEVENT
UID:${Date.now()}@candypic.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${startDate}
DTEND;VALUE=DATE:${endDate}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `booking-${start}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};