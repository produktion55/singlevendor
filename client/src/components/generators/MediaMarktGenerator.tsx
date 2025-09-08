import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MediaMarktFormData {
  bestellnummer: string;
  nummerObenRechts: string;
  rechnungsname: string;
  liefername: string;
  bestelldatum: string;
  rechnungsdatum: string;
  rechnungsstrasse: string;
  lieferstrasse: string;
  lieferort: string;
  rechnungsnummer: string;
  rechnungsstadt: string;
  lieferstadt: string;
  zahlungsart: string;
  rechnungstelefonummer: string;
  liefertelefonummer: string;
  artikelnummer: string;
  menge: string;
  einzelpreis: string;
  produktbezeichnung: string;
  imei: string;
}

export function MediaMarktGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<MediaMarktFormData>({
    bestellnummer: "",
    nummerObenRechts: "",
    rechnungsname: "",
    liefername: "",
    bestelldatum: "",
    rechnungsdatum: "",
    rechnungsstrasse: "",
    lieferstrasse: "",
    lieferort: "Zustellung",
    rechnungsnummer: "",
    rechnungsstadt: "",
    lieferstadt: "",
    zahlungsart: "PayPal",
    rechnungstelefonummer: "",
    liefertelefonummer: "",
    artikelnummer: "",
    menge: "1",
    einzelpreis: "",
    produktbezeichnung: "",
    imei: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  React.useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      const response = await apiRequest("GET", `/api/orders/user/${user?.id}`);
      const orders = await response.json();
      const mediaMarktOrders = orders.filter((order: any) => 
        order.productId === "prod-6" && order.status === "delivered"
      );
      setUserOrders(mediaMarktOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const handleInputChange = (field: keyof MediaMarktFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    } as MediaMarktFormData));
  };

  const handleGenerate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to generate invoices",
        variant: "destructive"
      });
      return;
    }

    // Validation
    const requiredFields = ['bestellnummer', 'rechnungsname', 'bestelldatum', 'rechnungsdatum', 'produktbezeichnung'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Send generation request
      const response = await apiRequest("POST", "/api/generate-mediamarkt", {
        formData,
        userId: user.id,
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Generation Started",
          description: "Your MediaMarkt invoice is being generated. You'll be notified when ready.",
        });
        
        // Refresh orders to show new pending generation
        setTimeout(() => {
          fetchUserOrders();
        }, 1000);
      } else {
        throw new Error(result.error || "Generation failed");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate invoice",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (orderId: string) => {
    try {
      const response = await fetch(`/api/download/mediamarkt-rechnung_${user?.id}_${orderId}.png`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `MediaMarkt_Rechnung_${orderId}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Started",
          description: "Your MediaMarkt invoice is downloading",
        });
      } else {
        throw new Error("File not found or not ready yet");
      }
    } catch (error: any) {
      toast({
        title: "Download Error",
        description: error.message || "Failed to download invoice",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            MediaMarkt Online Rechnung Generator
          </CardTitle>
          <CardDescription>
            Generate professional MediaMarkt invoices with customizable order details and product specifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bestellnummer">Bestellnummer *</Label>
              <Input
                id="bestellnummer"
                value={formData.bestellnummer}
                onChange={(e) => handleInputChange('bestellnummer', e.target.value)}
                placeholder="160026513"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nummerObenRechts">Nummer oben rechts</Label>
              <Input
                id="nummerObenRechts"
                value={formData.nummerObenRechts}
                onChange={(e) => handleInputChange('nummerObenRechts', e.target.value)}
                placeholder="5063478231"
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rechnungsname">Rechnungsname *</Label>
              <Input
                id="rechnungsname"
                value={formData.rechnungsname}
                onChange={(e) => handleInputChange('rechnungsname', e.target.value)}
                placeholder="James Bond"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liefername">Liefername</Label>
              <Input
                id="liefername"
                value={formData.liefername}
                onChange={(e) => handleInputChange('liefername', e.target.value)}
                placeholder="James Bond"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bestelldatum">Bestelldatum *</Label>
              <Input
                id="bestelldatum"
                type="date"
                value={formData.bestelldatum}
                onChange={(e) => handleInputChange('bestelldatum', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rechnungsdatum">Rechnungsdatum *</Label>
              <Input
                id="rechnungsdatum"
                type="date"
                value={formData.rechnungsdatum}
                onChange={(e) => handleInputChange('rechnungsdatum', e.target.value)}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rechnungsstrasse">Rechnungsstrasse</Label>
              <Input
                id="rechnungsstrasse"
                value={formData.rechnungsstrasse}
                onChange={(e) => handleInputChange('rechnungsstrasse', e.target.value)}
                placeholder="Agentenstsr. 7"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieferstrasse">Lieferstrasse</Label>
              <Input
                id="lieferstrasse"
                value={formData.lieferstrasse}
                onChange={(e) => handleInputChange('lieferstrasse', e.target.value)}
                placeholder="Agentenstsr. 7"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lieferort">Lieferort</Label>
              <Select value={formData.lieferort} onValueChange={(value) => handleInputChange('lieferort', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zustellung">Zustellung</SelectItem>
                  <SelectItem value="Abholung">Abholung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rechnungsnummer">Rechnungsnummer</Label>
              <Input
                id="rechnungsnummer"
                value={formData.rechnungsnummer}
                onChange={(e) => handleInputChange('rechnungsnummer', e.target.value)}
                placeholder="5063478231"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rechnungsstadt">Rechnungsstadt</Label>
              <Input
                id="rechnungsstadt"
                value={formData.rechnungsstadt}
                onChange={(e) => handleInputChange('rechnungsstadt', e.target.value)}
                placeholder="80802 München"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieferstadt">Lieferstadt</Label>
              <Input
                id="lieferstadt"
                value={formData.lieferstadt}
                onChange={(e) => handleInputChange('lieferstadt', e.target.value)}
                placeholder="80802 München"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zahlungsart">Zahlungsart</Label>
              <Select value={formData.zahlungsart} onValueChange={(value) => handleInputChange('zahlungsart', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Kreditkarte">Kreditkarte</SelectItem>
                  <SelectItem value="SEPA">SEPA</SelectItem>
                  <SelectItem value="Rechnung">Rechnung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rechnungstelefonummer">Rechnungstelefonummer</Label>
              <Input
                id="rechnungstelefonummer"
                value={formData.rechnungstelefonummer}
                onChange={(e) => handleInputChange('rechnungstelefonummer', e.target.value)}
                placeholder="49151889977"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="liefertelefonummer">Liefertelefonummer</Label>
              <Input
                id="liefertelefonummer"
                value={formData.liefertelefonummer}
                onChange={(e) => handleInputChange('liefertelefonummer', e.target.value)}
                placeholder="49151889977"
              />
            </div>
          </div>

          {/* Product Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="artikelnummer">Artikelnummer</Label>
              <Input
                id="artikelnummer"
                value={formData.artikelnummer}
                onChange={(e) => handleInputChange('artikelnummer', e.target.value)}
                placeholder="2954329"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menge">Menge</Label>
              <Input
                id="menge"
                value={formData.menge}
                onChange={(e) => handleInputChange('menge', e.target.value)}
                placeholder="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="einzelpreis">Einzelpreis</Label>
              <Input
                id="einzelpreis"
                value={formData.einzelpreis}
                onChange={(e) => handleInputChange('einzelpreis', e.target.value)}
                placeholder="1379.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="produktbezeichnung">Produktbezeichnung *</Label>
            <Textarea
              id="produktbezeichnung"
              value={formData.produktbezeichnung}
              onChange={(e) => handleInputChange('produktbezeichnung', e.target.value)}
              placeholder="APPLE iPhone 16 Pro Max 5G 256 GB Titan Schwarz Dual SIM"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="imei">IMEI</Label>
            <Textarea
              id="imei"
              value={formData.imei}
              onChange={(e) => handleInputChange('imei', e.target.value)}
              placeholder="Enter IMEI number if applicable"
              rows={2}
            />
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Invoice
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Invoices */}
      {userOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Generated Invoices</CardTitle>
            <CardDescription>
              Download your previously generated MediaMarkt invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium">Order #{order.id}</p>
                    <p className="text-sm text-gray-500">
                      Generated: {new Date(order.deliveredAt || order.createdAt).toLocaleDateString()}
                    </p>
                    <Badge variant={order.orderData?.fileReady ? "default" : "secondary"}>
                      {order.orderData?.fileReady ? "Ready" : "Processing"}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => handleDownload(order.id)}
                    disabled={!order.orderData?.fileReady}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}