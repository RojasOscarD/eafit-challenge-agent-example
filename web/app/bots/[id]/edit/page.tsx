"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditBotPage() {
  const router = useRouter();
  const params = useParams();
  const botId = params.id as string;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const res = await fetch(`/api/bots/${botId}`);
        if (res.ok) {
          const data = await res.json();
          const bot = data.bot;
          setFormData({
            name: bot.name || '',
            personaName: bot.persona_name || '',
            personaProfession: bot.persona_profession || '',
            personaDescription: bot.persona_description || '',
            personaPhotoUrl: bot.persona_photo_url || '',
            serviceName: bot.service_name || '',
            serviceDescription: bot.service_description || '',
            serviceCategory: bot.service_category || '',
            prompt: bot.prompt || '',
            llmModel: bot.llm_model || 'gpt-5.4-mini',
            temperature: bot.temperature || 0.2,
            mcpServices: bot.mcp_services || [],
            ragEnabled: bot.rag_enabled || false,
            ragDocsPath: bot.rag_docs_path || '',
          });
        }
      } catch (error) {
        console.error('Error fetching bot:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [botId]);

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
      const res = await fetch(`/api/bots/${botId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error updating bot:', error);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: // Service step
        return formData.serviceName && formData.serviceCategory;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Bot Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="My AI Assistant"
              />
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Persona Attributes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personaName">Name</Label>
                  <Input
                    id="personaName"
                    value={formData.personaName}
                    onChange={(e) => updateField('personaName', e.target.value)}
                    placeholder="Alex"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personaProfession">Profession</Label>
                  <Input
                    id="personaProfession"
                    value={formData.personaProfession}
                    onChange={(e) => updateField('personaProfession', e.target.value)}
                    placeholder="Technical Assistant"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="personaDescription">Description</Label>
                <Textarea
                  id="personaDescription"
                  value={formData.personaDescription}
                  onChange={(e) => updateField('personaDescription', e.target.value)}
                  placeholder="A helpful AI assistant specialized in..."
                  rows={3}
                />
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="personaPhotoUrl">Photo URL</Label>
                <Input
                  id="personaPhotoUrl"
                  value={formData.personaPhotoUrl}
                  onChange={(e) => updateField('personaPhotoUrl', e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name *</Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) => updateField('serviceName', e.target.value)}
                placeholder="Customer Support Bot"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceCategory">Category *</Label>
              <Select value={formData.serviceCategory} onValueChange={(v) => updateField('serviceCategory', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Service Description</Label>
              <Textarea
                id="serviceDescription"
                value={formData.serviceDescription}
                onChange={(e) => updateField('serviceDescription', e.target.value)}
                placeholder="This bot helps with..."
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => updateField('prompt', e.target.value)}
                placeholder="You are a helpful assistant..."
                rows={8}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="llmModel">LLM Model</Label>
                <Select value={formData.llmModel} onValueChange={(v) => updateField('llmModel', v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-5.4-mini">GPT-5.4 Mini</SelectItem>
                    <SelectItem value="gpt-5.4">GPT-5.4</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select the MCP services your bot should have access to:
            </p>
            {MCP_SERVICES.map((service) => (
              <div
                key={service.id}
                className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleMcpService(service.id)}
              >
                <Checkbox
                  checked={formData.mcpServices.includes(service.id)}
                  onCheckedChange={() => toggleMcpService(service.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{service.name}</h4>
                    <Badge variant="outline">MCP</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                </div>
              </div>
            ))}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ragEnabled"
                checked={formData.ragEnabled}
                onCheckedChange={(checked) => updateField('ragEnabled', checked)}
              />
              <Label htmlFor="ragEnabled" className="font-medium cursor-pointer">
                Enable RAG (Retrieval-Augmented Generation)
              </Label>
            </div>
            {formData.ragEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Document Upload</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-sm text-gray-600">
                      Drag and drop files here, or click to browse
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Supports: PDF, DOCX, TXT, MD (Max 10MB each)
                    </p>
                    <Button variant="outline" className="mt-4" type="button">
                      Browse Files
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ragDocsPath">Documents Path</Label>
                  <Input
                    id="ragDocsPath"
                    value={formData.ragDocsPath}
                    onChange={(e) => updateField('ragDocsPath', e.target.value)}
                    placeholder="/app/rag/docs"
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
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Edit Bot</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`flex flex-col items-center space-y-2 ${
                  index <= currentStep ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStep ? 'bg-primary text-white' : 'bg-gray-200'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.label}</span>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStep].label}</CardTitle>
            <CardDescription>
              {currentStep === 0 && "Define your bot's identity and persona"}
              {currentStep === 1 && "Describe the service your bot provides"}
              {currentStep === 2 && "Configure AI behavior and prompts"}
              {currentStep === 3 && "Connect external services via MCP"}
              {currentStep === 4 && "Enable document retrieval capabilities"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSave}
              disabled={saving || !formData.name}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
