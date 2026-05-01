"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Save, Bot, User, Briefcase, MessageSquare, Puzzle, FileText, Loader2 } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 'persona', label: 'Persona', icon: User },
  { id: 'service', label: 'Service', icon: Briefcase },
  { id: 'prompt', label: 'Prompt', icon: MessageSquare },
  { id: 'mcp', label: 'MCP Services', icon: Puzzle },
  { id: 'rag', label: 'RAG', icon: FileText },
];

const MCP_SERVICES = [
  { id: 'github', name: 'GitHub', description: 'Search repositories, issues, and pull requests' },
  { id: 'google-calendar', name: 'Google Calendar', description: 'Read and create calendar events' },
  { id: 'gmail', name: 'Gmail', description: 'Send and read emails' },
  { id: 'twitter', name: 'X (Twitter)', description: 'Post tweets and read timeline' },
  { id: 'sheets', name: 'Google Sheets', description: 'Read and write spreadsheet data' },
  { id: 'weather', name: 'Weather API', description: 'Check weather conditions' },
  { id: 'wikipedia', name: 'Wikipedia', description: 'Search encyclopedia content' },
];

const CATEGORIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Entertainment',
  'Business',
  'Other',
];

export default function NewBotPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    personaName: '',
    personaProfession: '',
    personaDescription: '',
    personaPhotoUrl: '',
    serviceName: '',
    serviceDescription: '',
    serviceCategory: '',
    prompt: '',
    llmModel: 'gpt-5.4-mini',
    temperature: 0.2,
    mcpServices: [] as string[],
    ragEnabled: false,
    ragDocsPath: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMcpService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      mcpServices: prev.mcpServices.includes(serviceId)
        ? prev.mcpServices.filter(id => id !== serviceId)
        : [...prev.mcpServices, serviceId]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error saving bot:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.name && formData.personaName;
      case 1:
        return formData.serviceName && formData.serviceCategory;
      case 2:
        return formData.prompt;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Persona
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Bot Name *</Label>
              <Input
                id="name"
                placeholder="My Awesome Bot"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaName">Persona Name *</Label>
              <Input
                id="personaName"
                placeholder="Alex"
                value={formData.personaName}
                onChange={(e) => updateField('personaName', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">The name your agent will use</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaProfession">Profession</Label>
              <Input
                id="personaProfession"
                placeholder="Software Engineer"
                value={formData.personaProfession}
                onChange={(e) => updateField('personaProfession', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaDescription">Persona Description</Label>
              <Textarea
                id="personaDescription"
                placeholder="A friendly and knowledgeable assistant..."
                value={formData.personaDescription}
                onChange={(e) => updateField('personaDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaPhotoUrl">Photo URL</Label>
              <Input
                id="personaPhotoUrl"
                placeholder="https://example.com/avatar.png"
                value={formData.personaPhotoUrl}
                onChange={(e) => updateField('personaPhotoUrl', e.target.value)}
              />
            </div>
          </div>
        );

      case 1: // Service
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                placeholder="GitHub Assistant"
                value={formData.serviceName}
                onChange={(e) => updateField('serviceName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Service Description</Label>
              <Textarea
                id="serviceDescription"
                placeholder="Helps you manage GitHub repositories and issues..."
                value={formData.serviceDescription}
                onChange={(e) => updateField('serviceDescription', e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Category *</Label>
              <Select
                value={formData.serviceCategory}
                onValueChange={(value) => updateField('serviceCategory', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2: // Prompt
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Personality Prompt *</Label>
              <Textarea
                id="prompt"
                placeholder="You are a helpful assistant specialized in..."
                value={formData.prompt}
                onChange={(e) => updateField('prompt', e.target.value)}
                rows={8}
              />
              <p className="text-sm text-muted-foreground">
                Define your agent&apos;s personality and behavior instructions
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="llmModel">LLM Model</Label>
                <Select
                  value={formData.llmModel}
                  onValueChange={(value) => updateField('llmModel', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5.4-mini">GPT-5.4 Mini</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature</Label>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        );

      case 3: // MCP Services
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select the external tools your agent can access during conversations
            </p>
            <div className="grid gap-4">
              {MCP_SERVICES.map((service) => (
                <div
                  key={service.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.mcpServices.includes(service.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleMcpService(service.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={formData.mcpServices.includes(service.id)}
                      onCheckedChange={() => toggleMcpService(service.id)}
                    />
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 4: // RAG
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ragEnabled"
                checked={formData.ragEnabled}
                onCheckedChange={(checked) => updateField('ragEnabled', checked)}
              />
              <Label htmlFor="ragEnabled" className="font-medium">
                Enable RAG (Retrieval Augmented Generation)
              </Label>
            </div>
            
            {formData.ragEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Upload Documents</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports PDF, DOCX, TXT, MD (max 10MB)
                    </p>
                    <Input
                      type="file"
                      multiple
                      className="hidden"
                      accept=".pdf,.docx,.txt,.md"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ragDocsPath">Documents Path</Label>
                  <Input
                    id="ragDocsPath"
                    placeholder="/app/rag/docs"
                    value={formData.ragDocsPath}
                    onChange={(e) => updateField('ragDocsPath', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold">Create New Bot</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-2 flex-1 ${
                    index < STEPS.length - 1 ? 'relative' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`absolute top-5 left-1/2 w-full h-0.5 -z-10 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].label}</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {STEPS.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep < STEPS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Bot
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
