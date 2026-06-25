import { cn } from "../../lib/utils"

/** Glass surface chrome shared by Input, Textarea, Select, and InputGroup. */
export const inputVisualClassName = "input-surface"

/** Typography, placeholder, and file-input behavior for field controls. */
export const inputInteractionClassName =
  "text-text placeholder:text-text-muted file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text"

/** Full visual + interaction tokens for text field controls. */
export const inputBaseClassName = cn(
  inputVisualClassName,
  inputInteractionClassName,
)
