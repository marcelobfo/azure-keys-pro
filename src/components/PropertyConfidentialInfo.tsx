import React, { useState } from 'react';
import { Lock, ChevronDown, ChevronUp, Repeat, User, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProfile } from '@/hooks/useProfile';

interface PropertyConfidentialInfoProps {
  negotiationNotes?: string;
  acceptsExchange?: boolean;
  brokerName?: string;
  brokerCreci?: string;
}

const PropertyConfidentialInfo: React.FC<PropertyConfidentialInfoProps> = ({
  negotiationNotes,
  acceptsExchange,
  brokerName,
  brokerCreci,
}) => {
  const { profile, loading } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  // Só renderizar se o usuário for corretor, admin ou master
  if (loading) return null;
  if (!profile) return null;
  if (!['corretor', 'admin', 'master'].includes(profile.role)) return null;

  // Verificar se há alguma informação para mostrar
  const hasContent = negotiationNotes || acceptsExchange !== undefined || brokerName || brokerCreci;
  if (!hasContent) return null;

  return (
    <Card className="mt-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-4 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-t-lg"
          >
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Lock className="w-5 h-5" />
              <span className="font-semibold">Informações para Corretores</span>
              <Badge variant="outline" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                Confidencial
              </Badge>
            </div>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-4 pt-0 space-y-4">
            {/* Corretor Responsável */}
            {(brokerName || brokerCreci) && (
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800">
                <User className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Corretor Responsável</p>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {brokerName || 'Não informado'}
                    {brokerCreci && (
                      <span className="text-gray-500 dark:text-gray-400 font-normal ml-2">
                        (CRECI: {brokerCreci})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Aceita Permuta */}
            {acceptsExchange !== undefined && (
              <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800">
                <Repeat className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aceita Permuta</p>
                  <Badge 
                    variant={acceptsExchange ? "default" : "secondary"}
                    className={acceptsExchange 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }
                  >
                    {acceptsExchange ? '✅ Sim' : '❌ Não'}
                  </Badge>
                </div>
              </div>
            )}

            {/* Notas de Negociação */}
            {negotiationNotes && (
              <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notas de Negociação</p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-md border-l-4 border-amber-400">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-line">
                        {negotiationNotes}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default PropertyConfidentialInfo;
