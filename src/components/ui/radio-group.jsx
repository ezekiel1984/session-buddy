import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

const RadioGroupContext = React.createContext({
  value: undefined,
  onValueChange: () => {}
});

const RadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div className={cn("grid gap-2", className)} {...props} ref={ref} />
    </RadioGroupContext.Provider>
  );
});
RadioGroup.displayName = "RadioGroup";

const RadioGroupItem = React.forwardRef(({ className, value, ...props }, ref) => {
  const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext);
  const isChecked = selectedValue === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-gray-600 text-white ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "border-[#25A55F] bg-[#25A55F]",
        className
      )}
      onClick={() => onValueChange?.(value)}
      ref={ref}
      {...props}
    >
      {isChecked && (
        <div className="flex items-center justify-center">
          <Circle className="h-2.5 w-2.5 fill-white text-white" />
        </div>
      )}
    </button>
  );
});
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem }