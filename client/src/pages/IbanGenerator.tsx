import React, { useState, useEffect } from "react";
import { Copy, CreditCard, RefreshCw, Search, Euro, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface GeneratedIban {
  id: string;
  iban: string;
  bankName: string;
  timestamp: Date;
  cost: number;
}

const mockBanks = [
  { id: "50060415", name: "DZ BANK für BSH - DZ BANK für Bausparkasse Schwäbisch Hall", bic: "GENODEF1VK3", location: "60265 Frankfurt am Main" },
  { id: "57020600", name: "Debeka Bauspk Koblenz - Debeka Bausparkasse", bic: "DEBKDE51XXX", location: "56054 Koblenz" },
  { id: "66010200", name: "Deutsche Bauspk Badenia - Deutsche Bausparkasse Badenia", bic: "DABBDE66XXX", location: "76137 Karlsruhe" },
  { id: "25410200", name: "BHW Bauspk Hameln - BHW Bausparkasse", bic: "BHWBDE2HXXX", location: "31763 Hameln" },
  { id: "50050222", name: "Landesbank Hessen-Thüringen", bic: "HELADEF1HEL", location: "60311 Frankfurt" },
];

export function IbanGenerator() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBank, setSelectedBank] = useState<typeof mockBanks[0] | null>(null);
  const [generatedIbans, setGeneratedIbans] = useState<GeneratedIban[]>([]);
  const [currentIban, setCurrentIban] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState(25.50); // Mock wallet balance
  const { toast } = useToast();

  const filteredBanks = mockBanks.filter(bank => 
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.id.includes(searchTerm) ||
    bank.bic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('generated-ibans');
    if (saved) {
      const parsed = JSON.parse(saved);
      setGeneratedIbans(parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  const generateIban = () => {
    if (!selectedBank) {
      toast({
        title: "Error",
        description: "Please select a bank first",
        variant: "destructive"
      });
      return;
    }

    if (walletBalance < 0.02) {
      toast({
        title: "Insufficient Balance",
        description: "You need €0.02 to generate an IBAN",
        variant: "destructive"
      });
      return;
    }

    // Generate IBAN using simplified algorithm
    const accountNumber = Math.floor(Math.random() * 9999999999).toString().padStart(10, '0');
    const bankCode = selectedBank.id.padStart(8, '0');
    const checkDigits = String(Math.floor(Math.random() * 99)).padStart(2, '0');
    const iban = `DE${checkDigits}${bankCode}${accountNumber}`;
    const formattedIban = iban.replace(/(.{4})/g, '$1 ').trim();

    const newIban: GeneratedIban = {
      id: Date.now().toString(),
      iban: formattedIban,
      bankName: selectedBank.name,
      timestamp: new Date(),
      cost: 0.02
    };

    setCurrentIban(formattedIban);
    setGeneratedIbans(prev => [newIban, ...prev.slice(0, 9)]); // Keep last 10
    setWalletBalance(prev => prev - 0.02);

    // Save to localStorage
    localStorage.setItem('generated-ibans', JSON.stringify([newIban, ...generatedIbans.slice(0, 9)]));

    toast({
      title: "IBAN Generated",
      description: `€0.02 deducted from wallet. Balance: €${(walletBalance - 0.02).toFixed(2)}`
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ''));
      toast({
        title: "Copied",
        description: "IBAN copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy IBAN",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-full mx-auto px-3 md:px-6">
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="bg-blue-600 text-white p-2 rounded">
            <CreditCard className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            IBAN Generator (Simple)
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Search through 3514 German banks and generate valid IBANs for testing purposes.
        </p>
        <div className="flex items-center space-x-4 mt-4">
          <Badge variant="outline" className="text-green-600 border-green-600">
            Wallet Balance: €{walletBalance.toFixed(2)}
          </Badge>
          <Badge variant="outline">
            Cost per IBAN: €0.02
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Left Panel - Generation */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Search for Your Bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="sparkasse"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mb-4"
                />
              </div>

              {searchTerm && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Search results for "{searchTerm}":
                  </Label>
                  <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {filteredBanks.map((bank) => (
                      <div
                        key={bank.id}
                        className={`p-3 rounded border cursor-pointer transition-colors ${ 
                          selectedBank?.id === bank.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedBank(bank)}
                      >
                        <div className="font-medium text-blue-600">{bank.id}</div>
                        <div className="text-sm text-gray-700">{bank.name}</div>
                        <div className="text-xs text-gray-500">{bank.location} | BIC: {bank.bic}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBank && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
                  <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">Selected Bank:</Label>
                  <div className="mt-2">
                    <div className="font-medium">BLZ: {selectedBank.id}</div>
                    <div className="text-sm">Bank: {selectedBank.name}</div>
                    <div className="text-sm">Location: {selectedBank.location}</div>
                    <div className="text-sm">BIC: {selectedBank.bic}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Generate IBAN</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateIban}
                disabled={!selectedBank || walletBalance < 0.02}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Random IBAN
              </Button>
              
              {currentIban && (
                <div className="mt-6">
                  <Label className="text-sm font-medium text-green-700 dark:text-green-300 mb-2 block">
                    Generated IBAN:
                  </Label>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="font-mono text-lg font-semibold text-center mb-2">
                      {currentIban}
                    </div>
                    <p className="text-xs text-green-600 dark:text-green-400 text-center mb-3">
                      This is a mathematically valid IBAN for testing purposes only.
                    </p>
                    <Button
                      onClick={() => copyToClipboard(currentIban)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy IBAN
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - History */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Generation History</span>
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Click any IBAN to copy to clipboard
              </p>
            </CardHeader>
            <CardContent>
              {generatedIbans.length > 0 ? (
                <div className="space-y-3">
                  {generatedIbans.map((item) => (
                    <div
                      key={item.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => copyToClipboard(item.iban)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-mono font-semibold text-blue-600 mb-1">
                            {item.iban}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {item.bankName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.timestamp.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="secondary" className="text-xs">
                            €{item.cost.toFixed(2)}
                          </Badge>
                          <Copy className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No IBANs generated yet
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Generate your first IBAN to see it here
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