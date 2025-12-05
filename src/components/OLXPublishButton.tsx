import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Upload, Trash2, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface OLXPublishButtonProps {
  propertyId: string;
  olxStatus?: string | null;
  olxErrorMessage?: string | null;
  onStatusChange?: () => void;
}

const OLXPublishButton = ({ 
  propertyId, 
  olxStatus, 
  olxErrorMessage,
  onStatusChange 
}: OLXPublishButtonProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Get tenant_id from profile
  const tenantId = profile?.tenant_id;

  const handlePublish = async () => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado',
        variant: 'destructive',
      });
      return;
    }

    setPublishing(true);
    try {
      const { data, error } = await supabase.functions.invoke('olx-publish-property', {
        body: {
          property_id: propertyId,
          user_id: user.id,
          tenant_id: tenantId,
          operation: olxStatus === 'published' ? 'insert' : 'insert',
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: 'Anúncio enviado para a OLX. Aguarde a aprovação.',
        });
      } else {
        toast({
          title: 'Atenção',
          description: data?.statusMessage || 'Verifique os dados do imóvel',
          variant: 'destructive',
        });
      }

      onStatusChange?.();
    } catch (error: any) {
      console.error('Error publishing to OLX:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao publicar na OLX',
        variant: 'destructive',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;

    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('olx-delete-property', {
        body: {
          property_id: propertyId,
          user_id: user.id,
          tenant_id: tenantId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Sucesso!',
          description: 'Anúncio removido da OLX.',
        });
      } else {
        toast({
          title: 'Erro',
          description: data?.statusMessage || 'Erro ao remover anúncio',
          variant: 'destructive',
        });
      }

      onStatusChange?.();
    } catch (error: any) {
      console.error('Error deleting from OLX:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao remover da OLX',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = () => {
    switch (olxStatus) {
      case 'published':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" /> Publicado
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" /> Pendente
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Erro
          </Badge>
        );
      case 'deleted':
        return (
          <Badge variant="outline">
            <Trash2 className="h-3 w-3 mr-1" /> Removido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" /> Não publicado
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {getStatusBadge()}
        
        {olxStatus !== 'published' && olxStatus !== 'pending' && (
          <Button
            size="sm"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-1" />
            )}
            Publicar na OLX
          </Button>
        )}

        {olxStatus === 'published' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePublish}
              disabled={publishing}
            >
              {publishing ? (
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1" />
              )}
              Atualizar
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleting}
                >
                  {deleting ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-1" />
                  )}
                  Remover
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover anúncio da OLX?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá despublicar o anúncio da OLX. Você poderá publicá-lo novamente depois.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Confirmar Remoção
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>

      {olxStatus === 'error' && olxErrorMessage && (
        <p className="text-xs text-destructive">{olxErrorMessage}</p>
      )}
    </div>
  );
};

export default OLXPublishButton;
