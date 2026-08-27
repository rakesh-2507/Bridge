interface RoleSelectorProps {
  roles: string[];
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
}

function RoleSelector({
  roles,
  selectedRoles,
  onChange,
}: RoleSelectorProps) {
  const toggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      onChange(
        selectedRoles.filter(
          (item) => item !== role
        )
      );
    } else {
      onChange([...selectedRoles, role]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {roles.map((role) => {
        const selected =
          selectedRoles.includes(role);

        return (
          <button
            key={role}
            type="button"
            onClick={() => toggleRole(role)}
            className={`px-3 py-1.5 rounded-full border text-sm transition ${
              selected
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {selected ? "✓ " : ""}
            {role}
          </button>
        );
      })}
    </div>
  );
}

export default RoleSelector;