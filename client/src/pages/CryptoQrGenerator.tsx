import React, { useState, useRef } from "react";
import QRCode from "qrcode";
import { Download, Copy, QrCode, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { mockCryptoAddresses } from "@/data/mockData";

export function CryptoQrGenerator() {
  const [selectedCrypto, setSelectedCrypto] = useState<string>("bitcoin");
  const [address, setAddress] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const cryptoOptions = [
    {
      value: "bitcoin",
      label: "Bitcoin (BTC)",
      prefix: "bitcoin:",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      symbol: "₿"
    },
    {
      value: "litecoin", 
      label: "Litecoin (LTC)",
      prefix: "litecoin:",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
      symbol: "Ł"
    },
    {
      value: "monero",
      label: "Monero (XMR)", 
      prefix: "monero:",
      color: "text-gray-800",
      bgColor: "bg-gray-800",
      symbol: "M"
    }
  ];

  const selectedCryptoInfo = cryptoOptions.find(c => c.value === selectedCrypto);

  const generateQRCode = async () => {
    if (!address.trim()) {
      toast({
        title: "Error",
        description: "Please enter a cryptocurrency address",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Create the URI format for cryptocurrency payments
      const qrData = `${selectedCryptoInfo?.prefix}${address}`;
      
      // Generate QR code
      const dataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(dataUrl);
      
      toast({
        title: "Success",
        description: "QR code generated successfully"
      });
    } catch (error) {
      console.error("QR code generation error:", error);
      toast({
        title: "Error", 
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `${selectedCrypto}-qr-${Date.now()}.png`;
    link.href = qrCodeDataUrl;
    link.click();
    
    toast({
      title: "Downloaded",
      description: "QR code downloaded successfully"
    });
  };

  const copyToClipboard = async () => {
    if (!address.trim()) return;
    
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Copied",
        description: "Address copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy address",
        variant: "destructive"
      });
    }
  };

  const loadSampleAddress = () => {
    const sampleAddress = mockCryptoAddresses[selectedCrypto as keyof typeof mockCryptoAddresses];
    setAddress(sampleAddress);
  };

  return (
    <div className="max-w-full mx-auto px-3 md:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Crypto QR Code Generator
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Generate QR codes for cryptocurrency addresses to make payments easier
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wallet className="w-5 h-5" />
                <span>Address Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cryptocurrency Selection */}
              <div>
                <Label htmlFor="crypto-type">Cryptocurrency</Label>
                <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cryptoOptions.map((crypto) => (
                      <SelectItem key={crypto.value} value={crypto.value}>
                        <div className="flex items-center space-x-2">
                          <span className={`w-6 h-6 rounded-full ${crypto.bgColor} flex items-center justify-center text-xs font-bold ${crypto.color}`}>
                            {crypto.symbol}
                          </span>
                          <span>{crypto.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Address Input */}
              <div>
                <Label htmlFor="address">Address</Label>
                <div className="flex space-x-2">
                  <Input
                    id="address"
                    type="text"
                    placeholder={`Enter ${selectedCryptoInfo?.label} address`}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={!address.trim()}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Sample Address Button */}
              <Button
                variant="outline"
                onClick={loadSampleAddress}
                className="w-full"
              >
                Load Sample Address
              </Button>

              {/* Generate Button */}
              <Button
                onClick={generateQRCode}
                disabled={!address.trim() || isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isGenerating ? "Generating..." : "Generate QR Code"}
              </Button>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>How to Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Select your cryptocurrency type from the dropdown</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Enter or paste a valid cryptocurrency address</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Click "Generate QR Code" to create a scannable code</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                <span>Download or share the QR code for easy payments</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* QR Code Display Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <QrCode className="w-5 h-5" />
                <span>Generated QR Code</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qrCodeDataUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Generated QR Code"
                        className="w-64 h-64"
                      />
                    </div>
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCryptoInfo?.label} Address
                    </p>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-2 break-all">
                      <code className="text-xs font-mono">{address}</code>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={downloadQRCode}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copyToClipboard}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Address
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <QrCode className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter an address and click "Generate QR Code" to create a scannable code
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5">
                  ⚠️
                </div>
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>Always verify the address before making any transactions. QR codes can be easily copied, so ensure you're sharing them securely.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}