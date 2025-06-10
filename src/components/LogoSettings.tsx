
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LogoSettings = () => {
  const { toast } = useToast();
  const [logoUrl, setLogoUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 2MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewUrl(result);
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setLogoUrl(url);
    setPreviewUrl(url);
  };

  const handleSave = () => {
    // Save logo URL to localStorage or backend
    localStorage.setItem('maresia-logo', logoUrl);
    toast({
      title: "Logo atualizada!",
      description: "A logo foi salva com sucesso.",
    });
  };

  const handleRemove = () => {
    setLogoUrl('');
    setPreviewUrl('');
    localStorage.removeItem('maresia-logo');
    toast({
      title: "Logo removida",
      description: "A logo padrão será utilizada.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Logo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <Label htmlFor="logo-url">URL da Logo</Label>
          <Input
            id="logo-url"
            value={logoUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://exemplo.com/logo.png"
          />
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <Label>Ou faça upload de um arquivo</Label>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clique para fazer upload da logo
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, SVG até 2MB
              </p>
            </label>
          </div>
        </div>

        {/* Preview */}
        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-white dark:bg-slate-800">
              <img
                src={previewUrl}
                alt="Logo preview"
                className="h-12 w-auto object-contain"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <Button onClick={handleSave} disabled={!logoUrl}>
            Salvar Logo
          </Button>
          {logoUrl && (
            <Button variant="outline" onClick={handleRemove}>
              <X className="w-4 h-4 mr-2" />
              Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoSettings;
