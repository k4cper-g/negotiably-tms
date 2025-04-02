import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NodeSettingsFormProps {
  nodeType: any;
  nodeConfig: any;
  onConfigChange: (newConfig: any) => void;
}

const NodeSettingsForm = ({ nodeType, nodeConfig, onConfigChange }: NodeSettingsFormProps) => {
  const [config, setConfig] = useState<Record<string, any>>(nodeConfig || {});

  // Update config state when nodeConfig changes
  useEffect(() => {
    setConfig(nodeConfig || {});
  }, [nodeConfig]);

  // When form values change, update local state and notify parent
  const handleChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  // No configSchema, render a simple text field for raw JSON
  if (!nodeType?.configSchema?.properties) {
    return (
      <div className="space-y-4 w-full">
        <div className="text-sm text-muted-foreground mb-2">
          This node doesn't have a configuration schema. You can enter raw configuration:
        </div>
        <Textarea
          placeholder="Enter JSON configuration"
          value={JSON.stringify(config, null, 2)}
          onChange={(e) => {
            try {
              const newConfig = e.target.value ? JSON.parse(e.target.value) : {};
              setConfig(newConfig);
              onConfigChange(newConfig);
            } catch (err) {
              // Don't update if invalid JSON
            }
          }}
          className="font-mono text-xs h-48 w-full"
        />
      </div>
    );
  }

  // Render form fields based on schema
  const renderFormFields = () => {
    const { properties } = nodeType.configSchema;
    const requiredFields = nodeType.configSchema.required || [];

    return Object.entries(properties).map(([key, schema]: [string, any]) => {
      const isRequired = requiredFields.includes(key);
      const fieldValue = config[key] !== undefined ? config[key] : '';
      
      switch (schema.type) {
        case 'string':
          if (schema.enum) {
            return (
              <div className="space-y-2 mb-4" key={key}>
                <Label htmlFor={key} className="flex items-center">
                  {key} {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Select
                  value={fieldValue?.toString() || ''}
                  onValueChange={(value) => handleChange(key, value)}
                >
                  <SelectTrigger id={key}>
                    <SelectValue placeholder={`Select ${key}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {schema.enum.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {schema.description && (
                  <p className="text-xs text-muted-foreground">{schema.description}</p>
                )}
              </div>
            );
          }
          
          if (schema.format === 'textarea' || (schema.description && schema.description.includes('multiline'))) {
            return (
              <div className="space-y-2 mb-4" key={key}>
                <Label htmlFor={key} className="flex items-center">
                  {key} {isRequired && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Textarea
                  id={key}
                  placeholder={schema.placeholder || `Enter ${key}`}
                  value={fieldValue?.toString() || ''}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
                {schema.description && (
                  <p className="text-xs text-muted-foreground">{schema.description}</p>
                )}
              </div>
            );
          }
          
          return (
            <div className="space-y-2 mb-4" key={key}>
              <Label htmlFor={key} className="flex items-center">
                {key} {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={key}
                placeholder={schema.placeholder || `Enter ${key}`}
                value={fieldValue?.toString() || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                type={schema.format === 'url' ? 'url' : 'text'}
              />
              {schema.description && (
                <p className="text-xs text-muted-foreground">{schema.description}</p>
              )}
            </div>
          );
          
        case 'number':
          return (
            <div className="space-y-2 mb-4" key={key}>
              <Label htmlFor={key} className="flex items-center">
                {key} {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Input
                id={key}
                type="number"
                placeholder={schema.placeholder || `Enter ${key}`}
                value={fieldValue?.toString() || ''}
                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                min={schema.minimum}
                max={schema.maximum}
                step={schema.multipleOf || 1}
              />
              {schema.description && (
                <p className="text-xs text-muted-foreground">{schema.description}</p>
              )}
            </div>
          );
          
        case 'boolean':
          return (
            <div className="flex items-center justify-between mb-4" key={key}>
              <Label htmlFor={key} className="flex items-center">
                {key} {isRequired && <span className="text-red-500 ml-1">*</span>}
              </Label>
              <Switch
                id={key}
                checked={!!fieldValue}
                onCheckedChange={(checked) => handleChange(key, checked)}
              />
              {schema.description && (
                <p className="text-xs text-muted-foreground">{schema.description}</p>
              )}
            </div>
          );
          
        case 'object':
          // Check if this is a batch config object or another structured object that should have a form UI
          const hasNestedProperties = schema.properties && Object.keys(schema.properties).length > 0;
          
          if (hasNestedProperties && key === 'batch') {
            return (
              <div className="mb-4" key={key}>
                <Accordion type="single" collapsible defaultValue={key} className="bg-muted/40 rounded-md">
                  <AccordionItem value={key}>
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center">
                        {schema.title || key} {isRequired && <span className="text-red-500 ml-1">*</span>}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {schema.description && (
                        <p className="text-xs text-muted-foreground mb-3">{schema.description}</p>
                      )}
                      <div className="space-y-3">
                        {Object.entries(schema.properties).map(([propKey, propSchema]: [string, any]) => {
                          const propValue = config[key]?.[propKey] !== undefined ? config[key]?.[propKey] : 
                                           propSchema.default !== undefined ? propSchema.default : '';
                          
                          switch (propSchema.type) {
                            case 'string':
                              if (propSchema.enum) {
                                return (
                                  <div className="space-y-2" key={propKey}>
                                    <Label htmlFor={`${key}-${propKey}`} className="text-sm">
                                      {propSchema.title || propKey}
                                    </Label>
                                    <Select
                                      value={propValue?.toString() || ''}
                                      onValueChange={(value) => {
                                        const newObjValue = { ...config[key], [propKey]: value };
                                        handleChange(key, newObjValue);
                                      }}
                                    >
                                      <SelectTrigger id={`${key}-${propKey}`}>
                                        <SelectValue placeholder={`Select ${propKey}`} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {propSchema.enum.map((option: string) => (
                                          <SelectItem key={option} value={option}>
                                            {option}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {propSchema.description && (
                                      <p className="text-xs text-muted-foreground">{propSchema.description}</p>
                                    )}
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="space-y-2" key={propKey}>
                                  <Label htmlFor={`${key}-${propKey}`} className="text-sm">
                                    {propSchema.title || propKey}
                                  </Label>
                                  <Input
                                    id={`${key}-${propKey}`}
                                    placeholder={propSchema.placeholder || `Enter ${propKey}`}
                                    value={propValue?.toString() || ''}
                                    onChange={(e) => {
                                      const newObjValue = { ...config[key], [propKey]: e.target.value };
                                      handleChange(key, newObjValue);
                                    }}
                                  />
                                  {propSchema.description && (
                                    <p className="text-xs text-muted-foreground">{propSchema.description}</p>
                                  )}
                                </div>
                              );
                              
                            case 'number':
                              return (
                                <div className="space-y-2" key={propKey}>
                                  <Label htmlFor={`${key}-${propKey}`} className="text-sm">
                                    {propSchema.title || propKey}
                                  </Label>
                                  <Input
                                    id={`${key}-${propKey}`}
                                    type="number"
                                    placeholder={propSchema.placeholder || `Enter ${propKey}`}
                                    value={propValue?.toString() || ''}
                                    onChange={(e) => {
                                      const newObjValue = { ...config[key], [propKey]: parseFloat(e.target.value) };
                                      handleChange(key, newObjValue);
                                    }}
                                    min={propSchema.minimum}
                                    max={propSchema.maximum}
                                    step={propSchema.multipleOf || 1}
                                  />
                                  {propSchema.description && (
                                    <p className="text-xs text-muted-foreground">{propSchema.description}</p>
                                  )}
                                </div>
                              );
                              
                            default:
                              return null;
                          }
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          }
          
          // Default handling for other object types - using JSON textarea
          return (
            <div className="mb-4" key={key}>
              <Accordion type="single" collapsible className="bg-muted/40 rounded-md">
                <AccordionItem value={key}>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center">
                      {schema.title || key} {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    {schema.description && (
                      <p className="text-xs text-muted-foreground mb-3">{schema.description}</p>
                    )}
                    <Textarea
                      placeholder={`Enter ${key} as JSON`}
                      value={fieldValue ? JSON.stringify(fieldValue, null, 2) : ''}
                      onChange={(e) => {
                        try {
                          const parsed = e.target.value ? JSON.parse(e.target.value) : {};
                          handleChange(key, parsed);
                        } catch (err) {
                          // Don't update if invalid JSON
                        }
                      }}
                      className="font-mono text-xs"
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          );
          
        case 'array':
          return (
            <div className="mb-4" key={key}>
              <Accordion type="single" collapsible className="bg-muted/40 rounded-md">
                <AccordionItem value={key}>
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center">
                      {key} {isRequired && <span className="text-red-500 ml-1">*</span>}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {Array.isArray(config[key]) && config[key].map((item: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            {schema.items?.type === 'object' ? (
                              <Textarea
                                value={JSON.stringify(item, null, 2)}
                                onChange={(e) => {
                                  try {
                                    const newArray = [...(config[key] || [])];
                                    newArray[index] = JSON.parse(e.target.value);
                                    handleChange(key, newArray);
                                  } catch (err) {
                                    // Don't update if invalid JSON
                                  }
                                }}
                                className="font-mono text-xs"
                              />
                            ) : (
                              <Input
                                value={item?.toString() || ''}
                                onChange={(e) => {
                                  const newArray = [...(config[key] || [])];
                                  newArray[index] = e.target.value;
                                  handleChange(key, newArray);
                                }}
                              />
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const newArray = [...(config[key] || [])];
                                newArray.splice(index, 1);
                                handleChange(key, newArray);
                              }}
                              className="mt-2"
                            >
                              Remove
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                      <Button
                        onClick={() => {
                          const newArray = [...(config[key] || [])];
                          const newItem = schema.items?.type === 'object' ? {} : '';
                          newArray.push(newItem);
                          handleChange(key, newArray);
                        }}
                      >
                        Add Item
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          );
          
        default:
          return null;
      }
    });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="text-sm font-medium mb-2">Node Configuration</div>
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2 pr-4">
          {renderFormFields()}
        </div>
      </ScrollArea>
    </div>
  );
};

export default NodeSettingsForm; 