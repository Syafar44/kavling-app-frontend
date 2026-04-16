import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
  placeholder?: string;
  clearable?: boolean;
  onClear?: () => void;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, clearable, onClear, id, value, onChange, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, "-");
    const hasValue = value !== "" && value !== undefined && value !== null;

    function handleClear(e: React.MouseEvent) {
      e.preventDefault();
      if (onClear) {
        onClear();
      } else {
        // Trigger a synthetic change event with empty value
        const select = document.getElementById(selectId ?? "") as HTMLSelectElement;
        if (select) {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")?.set;
          nativeInputValueSetter?.call(select, "");
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            value={value}
            onChange={onChange}
            className={cn(
              "flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
              clearable && hasValue && "pr-8",
              error && "border-red-500 focus:ring-red-500",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {clearable && hasValue && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 text-gray-400 hover:text-red-500 transition-colors"
              tabIndex={-1}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Select };
