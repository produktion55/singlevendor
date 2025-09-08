import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Field } from '@shared/types/formBuilder';

interface FieldRendererProps {
  field: Field;
  value: any;
  error?: string;
  readOnly?: boolean;
  onChange: (value: any) => void;
  onBlur: () => void;
}

export default function FieldRenderer({
  field,
  value,
  error,
  readOnly = false,
  onChange,
  onBlur
}: FieldRendererProps) {
  const renderField = () => {
    switch (field.type) {
      case 'text':
        // Get validation properties (flat or nested)
        const textMinLength = (field as any).minLength ?? field.validation?.minLength;
        const textMaxLength = (field as any).maxLength ?? field.validation?.maxLength;
        
        return (
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder || ''}
            disabled={readOnly || field.disabled}
            readOnly={field.readonly}
            minLength={textMinLength || undefined}
            maxLength={textMaxLength || undefined}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={readOnly || field.disabled}
            readOnly={field.readonly}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case 'number':
        const numberField = field as any; // Type assertion for number-specific properties
        return (
          <Input
            type="number"
            value={(value as number) || ''}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={readOnly || field.disabled}
            readOnly={field.readonly}
            min={numberField.min}
            max={numberField.max}
            step={numberField.step}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case 'textarea':
        const textareaField = field as any; // Type assertion for textarea-specific properties
        return (
          <Textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={readOnly || field.disabled}
            readOnly={field.readonly}
            rows={textareaField.rows || 4}
            className={error ? 'border-destructive' : ''}
          />
        );
      
      case 'select':
        const selectField = field as any; // Type assertion for select-specific properties
        const isMultiple = selectField.multiple;
        
        if (isMultiple) {
          // For multiple select, we'd need a different component
          // For now, fallback to single select
        }
        
        return (
          <Select
            value={(value as string) || ''}
            onValueChange={onChange}
            disabled={readOnly || field.disabled}
          >
            <SelectTrigger 
              className={error ? 'border-destructive' : ''}
              onBlur={onBlur}
            >
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {selectField.options?.map((option: string, index: number) => {
                const price = selectField.optionPrices?.[index];
                const priceType = selectField.optionPriceType || 'fixed';
                return (
                  <SelectItem key={`${option}-${index}`} value={option}>
                    <div className="flex justify-between items-center w-full">
                      <span>{option}</span>
                      {price !== undefined && price !== null && price !== 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {price > 0 ? '+' : ''}{priceType === 'percentage' ? `${price}%` : `$${price.toFixed(2)}`}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        const dateField = field as any; // Type assertion for date-specific properties
        const dateValue = value ? new Date(value as string) : undefined;
        const minDate = dateField.min ? new Date(dateField.min) : undefined;
        const maxDate = dateField.max ? new Date(dateField.max) : undefined;
        
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground',
                  error && 'border-destructive'
                )}
                disabled={readOnly || field.disabled}
                onBlur={onBlur}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, 'PPP') : <span>{field.placeholder || 'Pick a date'}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => onChange(date?.toISOString() || '')}
                initialFocus
                disabled={readOnly || field.disabled}
                fromDate={minDate}
                toDate={maxDate}
              />
            </PopoverContent>
          </Popover>
        );
      
      default:
        // For unknown field types, render as text input
        return (
          <Input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={(field as any).placeholder}
            disabled={readOnly || (field as any).disabled}
            readOnly={(field as any).readonly}
            className={error ? 'border-destructive' : ''}
          />
        );
    }
  };

  // Check if field has pricing info (for select fields and other fields with options)
  const fieldPricing = () => {
    if ('optionPrices' in field && field.optionPrices) {
      const fieldWithOptions = field as any;
      const selectedIndex = fieldWithOptions.options?.indexOf(value);
      if (selectedIndex >= 0 && fieldWithOptions.optionPrices?.[selectedIndex] !== undefined) {
        const price = fieldWithOptions.optionPrices[selectedIndex];
        if (price !== 0) {
          return {
            amount: price,
            type: fieldWithOptions.optionPriceType || 'fixed'
          };
        }
      }
    }
    return null;
  };
  
  const pricing = fieldPricing();

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="flex items-center gap-1">
        {field.label}
        {field.required && (
          <span className="text-destructive">*</span>
        )}
        {pricing && (
          <span className="ml-auto text-sm text-muted-foreground">
            Current: {pricing.amount > 0 ? '+' : ''}{pricing.type === 'percentage' ? `${pricing.amount}%` : `$${pricing.amount.toFixed(2)}`}
          </span>
        )}
      </Label>
      
      {renderField()}
      
      {field.description && !error && (
        <p className="text-sm text-muted-foreground" style={{ whiteSpace: 'pre-wrap' }}>
          {field.description}
        </p>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}