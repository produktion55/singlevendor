import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FormRenderer from '@/components/generators/FormBuilder/FormRenderer';
import testFormData from '@/data/testStandesamtForm.json';
import { FormSubmissionData, FormBuilderSchema } from '@shared/types/formBuilder';

export default function TestFormBuilder() {
  const [formData, setFormData] = useState<FormSubmissionData>({});
  const [additionalPrice, setAdditionalPrice] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    console.log('Form Data Submitted:', formData);
    console.log('Additional Price:', additionalPrice);
  };

  // Cast the imported JSON to proper type
  const formSchema: FormBuilderSchema = testFormData as any;

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-6xl mx-auto">
        <CardHeader>
          <CardTitle>Test Form Builder - Standesamt Form</CardTitle>
          <p className="text-muted-foreground">
            Testing enhanced form builder with complex German official form structure
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRenderer
            formBuilderSchema={formSchema}
            formDisplayMode="fullwidth"
            onDataChange={setFormData}
            onPriceChange={setAdditionalPrice}
            formTitle="Sterbeurkunde"
            formDescription="Bitte füllen Sie alle erforderlichen Felder aus"
          />
          
          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Additional Options Price:</span>
              <span className="text-lg font-bold">{additionalPrice.toFixed(2)}€</span>
            </div>
            
            <Button 
              onClick={handleSubmit} 
              className="w-full"
              size="lg"
            >
              Submit Form
            </Button>
          </div>

          {submitted && (
            <Card className="mt-6 p-4 bg-muted">
              <h3 className="font-semibold mb-2">Submitted Data:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(formData, null, 2)}
              </pre>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
