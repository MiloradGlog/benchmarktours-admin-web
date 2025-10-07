import * as React from "react";
import { Circle } from "lucide-react";
import { cn } from "../../lib/utils";

interface RadioGroupContextType {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextType>({});

interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, value, onValueChange, name, ...props }, ref) => {
    return (
      <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
        <div
          className={cn("grid gap-2", className)}
          {...props}
          ref={ref}
          role="radiogroup"
        />
      </RadioGroupContext.Provider>
    );
  }
);
RadioGroup.displayName = "RadioGroup";

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const { value: groupValue, onValueChange, name } = React.useContext(RadioGroupContext);
    const isChecked = value === groupValue;

    return (
      <div className="relative">
        <input
          type="radio"
          className="sr-only"
          ref={ref}
          value={value}
          name={name}
          checked={isChecked}
          onChange={() => onValueChange?.(value as string)}
          {...props}
        />
        <div
          className={cn(
            "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer flex items-center justify-center",
            isChecked ? "bg-primary" : "bg-background",
            className
          )}
          onClick={() => onValueChange?.(value as string)}
        >
          {isChecked && (
            <Circle className="h-2.5 w-2.5 fill-current text-white" />
          )}
        </div>
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };