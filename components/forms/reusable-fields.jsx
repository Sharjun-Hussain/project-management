"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { AlertCircle } from "lucide-react";

/**
 * Reusable Base Field Wrapper
 */
const FieldWrapper = ({ label, error, description, children, required, className, hideLabel = false }) => (
  <div className={cn("space-y-2 w-full", className)}>
    {label && !hideLabel && (
      <Label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
    )}
    {children}
    {description && <p className="text-[11px] text-slate-400 mt-1">{description}</p>}
    {error && (
      <div className="flex items-center gap-1.5 mt-1 text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="text-xs text-red-500">{error}</span>
      </div>
    )}
  </div>
);

/**
 * Reusable Input Field
 */
export const FormInput = React.memo(({
  label,
  error,
  description,
  required,
  className,
  containerClassName,
  suffix,
  prefix,
  ...props
}) => {
  return (
    <FieldWrapper label={label} error={error} description={description} required={required} className={containerClassName}>
      <div className="relative flex items-center w-full">
        {prefix && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none text-slate-400 dark:text-slate-500 text-xs font-semibold tracking-wide">
            {prefix}
          </div>
        )}
        <Input
          className={cn(
            "p-3 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white w-full",
            prefix && "pl-12",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
            className
          )}
          {...props}
        />
        {suffix && <div className="ml-2 flex-none">{suffix}</div>}
      </div>
    </FieldWrapper>
  );
});

FormInput.displayName = "FormInput";

/**
 * Reusable Select Field
 */
export const FormSelect = React.memo(({
  label,
  error,
  description,
  required,
  options = [],
  placeholder,
  value,
  onChange,
  className,
  containerClassName,
  ...props
}) => {
  return (
    <FieldWrapper label={label} error={error} description={description} required={required} className={containerClassName}>
      <Select onValueChange={onChange} value={String(value || "")} {...props}>
        <SelectTrigger className={cn(
          "p-3 h-11 w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white",
          error && "border-red-500",
          className
        )}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700">
          {options.map((option) => (
            <SelectItem key={option.value} value={String(option.value)} className="rounded-lg">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldWrapper>
  );
});

FormSelect.displayName = "FormSelect";

/**
 * Reusable Textarea Field
 */
export const FormTextarea = React.memo(({
  label,
  error,
  description,
  required,
  className,
  containerClassName,
  ...props
}) => {
  return (
    <FieldWrapper label={label} error={error} description={description} required={required} className={containerClassName}>
      <Textarea
        className={cn(
          "p-3 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:text-white min-h-[100px]",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
});

FormTextarea.displayName = "FormTextarea";

/**
 * Reusable Checkbox Field
 */
export const FormCheckbox = React.memo(({
  label,
  description,
  checked,
  onCheckedChange,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800/50 shadow-sm", className)}>
      <Checkbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="mt-1"
        {...props}
      />
      <div className="space-y-1 leading-none cursor-pointer" onClick={() => onCheckedChange(!checked)}>
        {label && <Label className="text-sm font-semibold text-slate-800 dark:text-white cursor-pointer">{label}</Label>}
        {description && <p className="text-[11px] text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
    </div>
  );
});

FormCheckbox.displayName = "FormCheckbox";

/**
 * Reusable Switch Field
 */
export const FormSwitch = React.memo(({
  label,
  description,
  checked,
  onCheckedChange,
  className,
  ...props
}) => {
  return (
    <div className={cn("flex flex-row items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800/50 shadow-sm", className)}>
      <div
        className="space-y-0.5 cursor-pointer select-none flex-1 mr-4"
        onClick={() => onCheckedChange && onCheckedChange(!checked)}
      >
        {label && <Label className="text-sm font-semibold text-slate-800 dark:text-white cursor-pointer">{label}</Label>}
        {description && <p className="text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">{description}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        {...props}
      />
    </div>
  );
});

FormSwitch.displayName = "FormSwitch";
