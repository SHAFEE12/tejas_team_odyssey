/**
 * RoleSelector — shared role tab-bar used on both Register and Login forms.
 * Renders 4 role buttons in a horizontal pill bar matching the Obsidian Glass system.
 *
 * Props:
 *   value     — currently selected role id string
 *   onChange  — (roleId: string) => void
 *   error     — optional error string to display below
 *   label     — header label text (e.g. "CHOOSE YOUR PATH" or "ENTER YOUR PORTAL")
 *   disabled  — disables all buttons when true
 */

const ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'industry', label: 'Industry' },
  { id: 'academician', label: 'Academician' },
  { id: 'institution', label: 'Institution' },
];

export default function RoleSelector({ value, onChange, error, label = 'CHOOSE YOUR PATH', disabled = false }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400">{label}</span>
      </div>
      <div
        className="grid grid-cols-4 gap-1 p-1 bg-black/50 border border-white/5 rounded-xl"
        role="radiogroup"
        aria-label="Select your role"
      >
        {ROLES.map((role) => {
          const isSelected = value === role.id;
          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(role.id)}
              disabled={disabled}
              className={[
                'py-2.5 px-1 text-center rounded-lg text-[13px] font-medium transition-all duration-150',
                'focus:outline-none focus:ring-1 focus:ring-white/30',
                isSelected
                  ? 'bg-white/10 text-white shadow-sm border border-white/15'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent',
                disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
              ].join(' ')}
            >
              {role.label}
            </button>
          );
        })}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400" role="alert">{error}</p>
      )}
    </div>
  );
}
