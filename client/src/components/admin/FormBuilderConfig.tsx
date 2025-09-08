import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FormRenderer } from '@/components/generators/FormBuilder';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import type { FormBuilderSchema } from '@shared/types/formBuilder';

interface FormBuilderConfigProps {
  value?: string;
  displayMode?: 'sidebar' | 'fullwidth';
  onChange: (json: string) => void;
  onDisplayModeChange: (mode: 'sidebar' | 'fullwidth') => void;
  disabled?: boolean;
}

const sampleFormJson: FormBuilderSchema = {
  sections: [
    {
      id: 1,
      name: "Basic Information",
      width: 100,
      isPadding: true,
      collapsible: true,
      expanded: true,
      fields: [
        {
          type: "text",
          label: "Full Name",
          name: "fullName",
          placeholder: "Enter your full name",
          required: true
        },
        {
          type: "email",
          label: "Email Address",
          name: "email",
          placeholder: "example@email.com",
          required: true
        }
      ]
    },
    {
      id: 2,
      name: "Preferences",
      width: 100,
      collapsible: true,
      expanded: true,
      fields: [
        {
          type: "select",
          label: "Preferred Theme",
          name: "theme",
          options: ["Light", "Dark", "Auto"],
          defaultValue: "Auto",
          required: false
        },
        {
          type: "number",
          label: "Age",
          name: "age",
          placeholder: "Enter your age",
          min: 18,
          max: 120,
          required: false
        }
      ]
    }
  ]
};

export function FormBuilderConfig({
  value = '',
  displayMode = 'sidebar',
  onChange,
  onDisplayModeChange,
  disabled = false
}: FormBuilderConfigProps) {
  const { toast } = useToast();
  const [jsonInput, setJsonInput] = useState(value);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedForm, setParsedForm] = useState<FormBuilderSchema | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Validate JSON whenever input changes (with debouncing)
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      validateJson(jsonInput);
    }, 500);

    setDebounceTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [jsonInput]);

  const validateJson = useCallback((json: string) => {
    if (!json.trim()) {
      setIsValid(false);
      setValidationError(null);
      setParsedForm(null);
      return;
    }

    try {
      const parsed = JSON.parse(json);
      
      // Basic structure validation
      if (!parsed.sections || !Array.isArray(parsed.sections)) {
        throw new Error('Invalid form structure: missing required field "sections" (must be an array)');
      }

      // Validate sections structure
      for (const section of parsed.sections) {
        if (!section.id || !section.name || !section.fields || !Array.isArray(section.fields)) {
          throw new Error(`Invalid section structure: ${section.name || 'unnamed section'} - missing required fields (id, name, fields)`);
        }

        if (!section.width || ![25, 50, 75, 100].includes(section.width)) {
          throw new Error(`Invalid section width in "${section.name}": must be 25, 50, 75, or 100`);
        }

        // Validate fields
        for (const field of section.fields) {
          if (!field.type || !field.name || !field.label) {
            throw new Error(`Invalid field in section "${section.name}": missing required properties (type, name, label)`);
          }

          const validTypes = ['text', 'select', 'textarea', 'date', 'number', 'email'];
          if (!validTypes.includes(field.type)) {
            throw new Error(`Invalid field type "${field.type}" in section "${section.name}". Valid types: ${validTypes.join(', ')}`);
          }

          // Validate select field options
          if (field.type === 'select' && (!field.options || !Array.isArray(field.options) || field.options.length === 0)) {
            throw new Error(`Select field "${field.label}" in section "${section.name}" must have options array`);
          }
        }
      }

      setIsValid(true);
      setValidationError(null);
      setParsedForm(parsed as FormBuilderSchema);
      onChange(json);
    } catch (error) {
      setIsValid(false);
      if (error instanceof SyntaxError) {
        setValidationError(`JSON Syntax Error: ${error.message}`);
      } else if (error instanceof Error) {
        setValidationError(error.message);
      } else {
        setValidationError('Invalid JSON format');
      }
      setParsedForm(null);
    }
  }, [onChange]);

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonInput(formatted);
      onChange(formatted);
      toast({
        title: 'JSON formatted',
        description: 'Your JSON has been prettified successfully.',
      });
    } catch (error) {
      toast({
        title: 'Format failed',
        description: 'Cannot format invalid JSON. Please fix syntax errors first.',
        variant: 'destructive'
      });
    }
  };

  const copySampleJson = () => {
    const sampleStr = JSON.stringify(sampleFormJson, null, 2);
    setJsonInput(sampleStr);
    onChange(sampleStr);
    toast({
      title: 'Sample JSON copied',
      description: 'A sample form structure has been loaded. Modify it to fit your needs.',
    });
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="form-json">Form Builder JSON</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copySampleJson}
                disabled={disabled}
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Sample
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={formatJson}
                disabled={disabled || !jsonInput.trim()}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Format JSON
              </Button>
            </div>
          </div>

          <Textarea
            id="form-json"
            value={jsonInput}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder="Paste your form builder JSON here..."
            className="font-mono text-sm min-h-[300px]"
            disabled={disabled}
          />

          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-600">
                JSON is valid and ready to use
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="display-mode">Display Mode</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="display-mode-switch" className="text-sm">
                {displayMode === 'sidebar' ? 'Sidebar' : 'Full Width'}
              </Label>
              <Switch
                id="display-mode-switch"
                checked={displayMode === 'fullwidth'}
                onCheckedChange={(checked) => 
                  onDisplayModeChange(checked ? 'fullwidth' : 'sidebar')
                }
                disabled={disabled}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Choose how the form will be displayed on the product page.
            {displayMode === 'sidebar' 
              ? ' Sidebar mode shows the form alongside product details.'
              : ' Full width mode displays the form below product details.'}
          </p>
        </div>
      </Card>

      {parsedForm && (
        <Collapsible open={showPreview} onOpenChange={setShowPreview}>
          <Card className="p-6">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <span className="flex items-center">
                  {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  Form Preview
                </span>
                {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-2">
                  Preview Mode: <span className="font-semibold">{displayMode === 'sidebar' ? 'Sidebar' : 'Full Width'}</span>
                </div>
                
                <div className={`border rounded-lg p-4 ${
                  displayMode === 'sidebar' ? 'max-w-md' : 'w-full'
                }`}>
                  <FormRenderer
                    formBuilderSchema={parsedForm}
                    formDisplayMode={displayMode}
                    readOnly={true}
                    onDataChange={(data) => {
                      console.log('Preview form data:', data);
                    }}
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}