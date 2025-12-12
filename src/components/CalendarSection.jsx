const CalendarSection = () => {
  const [selected, setSelected] = React.useState(null);

  // Fake blocked dates (you can fetch from backend)
  const blockedDates = ["2025-12-20", "2025-12-23", "2025-12-27"];

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Generate dates array
  const dates = [...Array(daysInMonth)].map((_, i) => {
    const d = new Date(year, month, i + 1);
    const iso = d.toISOString().split("T")[0];

    return {
      label: i + 1,
      iso,
      blocked: blockedDates.includes(iso)
    };
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 md:p-8 shadow-lg">
      
      <h3 className="text-xl font-serif text-white tracking-wide mb-6 text-center">
        Select Your Date
      </h3>

      <div className="grid grid-cols-7 gap-3 text-center text-gray-400 text-sm mb-4">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-3">
        {dates.map((d) => (
          <button
            key={d.iso}
            onClick={() => !d.blocked && setSelected(d.iso)}
            className={`
              py-3 rounded-lg text-sm font-medium transition-all
              ${d.blocked 
                ? "bg-red-900/40 text-red-300 cursor-not-allowed opacity-50"
                : "bg-white/5 text-white hover:bg-white/10 hover:scale-[1.05] active:scale-95"
              }
              ${selected === d.iso ? "bg-brand-red text-white scale-[1.1] shadow-lg" : ""}
            `}
          >
            {d.label}
          </button>
        ))}
      </div>

      {selected && (
        <p className="text-center text-brand-gold mt-6 font-medium tracking-wide">
          Selected Date: {selected}
        </p>
      )}
    </div>
  );
};
