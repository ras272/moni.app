'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { BudgetList } from '@/features/budgets/components/budget-list';
import type { BudgetStatus } from '@/lib/supabase/budgets';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

const CreateBudgetDialog = dynamic(
  () =>
    import('@/features/budgets/components/create-budget-dialog').then(
      (mod) => ({ default: mod.CreateBudgetDialog })
    ),
  {
    ssr: false,
    loading: () => (
      <Button disabled>
        <Plus className='mr-2 h-4 w-4' />
        Nuevo Presupuesto
      </Button>
    )
  }
);

interface BudgetsPageClientProps {
  budgets: BudgetStatus[];
}

export function BudgetsPageClient({
  budgets: initialBudgets
}: BudgetsPageClientProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleEditBudget = (budgetId: string) => {
    // TODO: Implement edit
    toast('Próximamente', {
      description: 'La edición de presupuestos estará disponible pronto'
    });
  };

  const handleDeleteBudget = (budgetId: string) => {
    setBudgetToDelete(budgetId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;

    setIsDeleting(true);

    try {
      const response = await fetch('/api/budgets/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: budgetToDelete })
      });

      if (!response.ok) {
        throw new Error('Error al eliminar presupuesto');
      }

      toast.success('Presupuesto eliminado', {
        description: 'El presupuesto se eliminó correctamente'
      });

      router.refresh();
    } catch (error) {
      toast.error('Error', {
        description: 'No se pudo eliminar el presupuesto'
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBudgetToDelete(null);
    }
  };

  return (
    <>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold tracking-tight'>Presupuestos</h2>
          <p className='text-muted-foreground'>
            Gestiona tus límites de gasto y controla tus finanzas
          </p>
        </div>
        {isMounted ? (
          <CreateBudgetDialog />
        ) : (
          <Button disabled>
            <Plus className='mr-2 h-4 w-4' />
            Nuevo Presupuesto
          </Button>
        )}
      </div>

      <BudgetList
        budgets={initialBudgets}
        onEditBudget={handleEditBudget}
        onDeleteBudget={handleDeleteBudget}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar presupuesto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El presupuesto se desactivará
              pero se mantendrá su historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
