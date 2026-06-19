"use client";

import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Plus, X } from "lucide-react";

type DynamicListInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  label: string;
  placeholder?: string;
  error?: string;
};

export const DynamicListInput = ({
  value,
  onChange,
  label,
  placeholder,
  error,
}: DynamicListInputProps) => {
  const items = value.length > 0 ? value : [""];

  const updateItem = (index: number, newValue: string) => {
    const updated = [...items];
    updated[index] = newValue;
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, ""]);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated.length > 0 ? updated : [""]);
  };

  const lastItem = items[items.length - 1];
  const canAdd = lastItem !== undefined && lastItem.trim().length > 0;

  return (
    <div className="space-y-2 w-full">
      <Label className="block text-xs tracking-wide text-text-muted">
        {label}
      </Label>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={placeholder}
            />
            {items.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 size-8 text-text-muted hover:text-error"
                onClick={() => removeItem(index)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {canAdd && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs text-text-muted"
          onClick={addItem}
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};
