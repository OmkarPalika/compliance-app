'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/language-context';
import { useToast } from '@/components/ui/use-toast';
import { MoreHorizontal, Archive, Trash2, Download } from 'lucide-react';

interface DocumentActionsProps {
  documentId: string;
  isArchived?: boolean;
  onDelete?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
}

export function DocumentActions({ 
  documentId, 
  isArchived = false, 
  onDelete, 
  onArchive, 
  onRestore 
}: DocumentActionsProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      toast({
        title: language === 'en' ? 'Document deleted' : 'تم حذف المستند',
        description: language === 'en' ? 'Document has been permanently deleted' : 'تم حذف المستند نهائياً',
      });
      
      onDelete?.();
    } catch {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Failed to delete document' : 'فشل في حذف المستند',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/archive`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !isArchived }),
      });
      
      if (!response.ok) throw new Error('Archive failed');
      
      toast({
        title: language === 'en' 
          ? (isArchived ? 'Document restored' : 'Document archived')
          : (isArchived ? 'تم استعادة المستند' : 'تم أرشفة المستند'),
      });
      
      if (isArchived) {
        onRestore?.();
      } else {
        onArchive?.();
      }
    } catch {
      toast({
        title: language === 'en' ? 'Error' : 'خطأ',
        description: language === 'en' ? 'Operation failed' : 'فشلت العملية',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.open(`/api/documents/${documentId}/export?format=excel`)}>
            <Download className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Export' : 'تصدير'}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleArchive} disabled={isLoading}>
            <Archive className="h-4 w-4 mr-2" />
            {language === 'en' 
              ? (isArchived ? 'Restore' : 'Archive')
              : (isArchived ? 'استعادة' : 'أرشفة')}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {language === 'en' ? 'Delete' : 'حذف'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'en' ? 'Delete Document' : 'حذف المستند'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'en' 
                ? 'This action cannot be undone. This will permanently delete the document and all its data.'
                : 'لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف المستند وجميع بياناته نهائياً.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'en' ? 'Cancel' : 'إلغاء'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === 'en' ? 'Delete' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}