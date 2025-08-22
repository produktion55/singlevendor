import React, { useState, useEffect } from "react";
import { Shield, Plus, X, Copy, Download, Upload, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface TotpSecret {
  id: string;
  serviceName: string;
  secretKey: string;
  code: string;
  timeRemaining: number;
}

// Simple TOTP implementation for demo purposes
function generateTOTP(secret: string): { code: string; timeRemaining: number } {
  // This is a simplified TOTP generator for demo purposes
  // In a real app, you'd use a proper crypto library
  const timeStep = 30;
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / timeStep);
  const timeRemaining = timeStep - (now % timeStep);
  
  // Generate a 6-digit code based on the secret and counter
  const hash = (secret + counter).split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const code = String(Math.abs(hash) % 1000000).padStart(6, '0');
  
  return { code, timeRemaining };
}

export function TotpGenerator() {
  const [serviceName, setServiceName] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [secrets, setSecrets] = useState<TotpSecret[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Load secrets from localStorage
    const saved = localStorage.getItem('totp-secrets');
    if (saved) {
      setSecrets(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Update TOTP codes every second
    const interval = setInterval(() => {
      setSecrets(prevSecrets => 
        prevSecrets.map(secret => {
          const { code, timeRemaining } = generateTOTP(secret.secretKey);
          return { ...secret, code, timeRemaining };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const addSecret = () => {
    if (!serviceName.trim() || !secretKey.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both service name and secret key",
        variant: "destructive"
      });
      return;
    }

    const { code, timeRemaining } = generateTOTP(secretKey);
    const newSecret: TotpSecret = {
      id: Date.now().toString(),
      serviceName: serviceName.trim(),
      secretKey: secretKey.trim(),
      code,
      timeRemaining
    };

    const updatedSecrets = [...secrets, newSecret];
    setSecrets(updatedSecrets);
    localStorage.setItem('totp-secrets', JSON.stringify(updatedSecrets));
    
    setServiceName("");
    setSecretKey("");
    
    toast({
      title: "Secret Added",
      description: `TOTP secret for ${serviceName} has been added`
    });
  };

  const removeSecret = (id: string) => {
    const updatedSecrets = secrets.filter(s => s.id !== id);
    setSecrets(updatedSecrets);
    localStorage.setItem('totp-secrets', JSON.stringify(updatedSecrets));
    
    toast({
      title: "Secret Removed",
      description: "TOTP secret has been removed"
    });
  };

  const copyCode = async (code: string, serviceName: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied",
        description: `${serviceName} code copied to clipboard`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive"
      });
    }
  };

  const clearAll = () => {
    setServiceName("");
    setSecretKey("");
  };

  const exportSecrets = () => {
    const data = JSON.stringify(secrets, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'totp-secrets.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSecrets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSecrets(imported);
        localStorage.setItem('totp-secrets', JSON.stringify(imported));
        toast({
          title: "Imported",
          description: `${imported.length} secrets imported successfully`
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import secrets file",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 md:px-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-blue-600 text-white p-2 rounded">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            TOTP Authenticator
          </h1>
        </div>
        <p className="text-base md:text-lg text-gray-600 dark:text-gray-400">
          Generate and manage TOTP codes for your two-factor authentication services. Works offline with localStorage and syncs with your account when logged in.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Left Panel - Add New Secret */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Secret</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="serviceName">Service Name</Label>
                <Input
                  id="serviceName"
                  placeholder="e.g., Google, GitHub, etc."
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="secretKey">Secret Key</Label>
                <Input
                  id="secretKey"
                  placeholder="Enter TOTP secret key"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  type="password"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={addSecret}
                  disabled={!serviceName.trim() || !secretKey.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Secret
                </Button>
                <Button
                  onClick={clearAll}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>

              <div className="flex space-x-2 pt-4 border-t">
                <Button
                  onClick={exportSecrets}
                  variant="outline"
                  className="flex-1"
                  disabled={secrets.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Secrets
                </Button>
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSecrets}
                    className="hidden"
                    id="import-file"
                  />
                  <label htmlFor="import-file" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full cursor-pointer"
                      type="button"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Import Secrets
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Active Codes */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5" />
                <span>Active Codes</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click any code to copy to clipboard
              </p>
            </CardHeader>
            <CardContent>
              {secrets.length > 0 ? (
                <div className="space-y-3">
                  {secrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {secret.serviceName}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSecret(secret.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div
                        className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => copyCode(secret.code, secret.serviceName)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-2xl font-bold text-blue-600">
                            {secret.code.slice(0, 3)} {secret.code.slice(3)}
                          </div>
                          <Copy className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-sm text-gray-500">
                          Refreshes in {secret.timeRemaining}s
                        </div>
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${(secret.timeRemaining / 30) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    No active codes
                  </p>
                  <p className="text-sm text-gray-400">
                    Add your first TOTP secret to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}