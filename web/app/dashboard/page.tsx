"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Plus, 
  Settings, 
  ExternalLink, 
  Play, 
  Square, 
  Trash2,
  Loader2,
  User,
  LogOut
} from "lucide-react";

interface BotData {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'published' | 'error';
  persona_name?: string;
  service_name?: string;
  public_url?: string;
  created_at: string;
  mcp_services: string[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [bots, setBots] = useState<BotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      const res = await fetch("/api/bots");
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setUser(data.user);
      } else if (res.status === 401) {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error fetching bots:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handlePublish = async (botId: string) => {
    setActionLoading(botId);
    try {
      const res = await fetch(`/api/bots/${botId}/publish`, { method: "POST" });
      if (res.ok) {
        fetchBots();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (botId: string) => {
    setActionLoading(botId);
    try {
      const res = await fetch(`/api/bots/${botId}/unpublish`, { method: "POST" });
      if (res.ok) {
        fetchBots();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (botId: string) => {
    if (!confirm("Are you sure you want to delete this bot?")) return;
    setActionLoading(botId);
    try {
      const res = await fetch(`/api/bots/${botId}`, { method: "DELETE" });
      if (res.ok) {
        fetchBots();
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success">Published</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Verana Agent Manager</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{user.name}</span>
                </div>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My AI Agents</h2>
            <p className="text-gray-600 mt-1">Create and manage your verifiable AI agents</p>
          </div>
          <Link href="/bots/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Bot
            </Button>
          </Link>
        </div>

        {bots.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No bots yet</h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                Create your first AI agent to get started with the Verana ecosystem
              </p>
              <Link href="/bots/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first bot
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <Card key={bot.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{bot.name}</CardTitle>
                      <CardDescription className="truncate">
                        {bot.persona_name || bot.service_name || "No description"}
                      </CardDescription>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(bot.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {bot.mcp_services && bot.mcp_services.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {bot.mcp_services.map((service) => (
                        <Badge key={service} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-500">
                    Created {new Date(bot.created_at).toLocaleDateString()}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link href={`/bots/${bot.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    
                    {bot.status === 'published' ? (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUnpublish(bot.id)}
                          disabled={actionLoading === bot.id}
                        >
                          {actionLoading === bot.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Square className="w-4 h-4 mr-1" />
                              Stop
                            </>
                          )}
                        </Button>
                        {bot.public_url && (
                          <Link href={bot.public_url} target="_blank">
                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Open
                            </Button>
                          </Link>
                        )}
                      </>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handlePublish(bot.id)}
                        disabled={actionLoading === bot.id}
                      >
                        {actionLoading === bot.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-1" />
                            Publish
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(bot.id)}
                      disabled={actionLoading === bot.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
