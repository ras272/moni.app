/**
 * =====================================================
 * COMPONENT: SplitTypeSelector
 * =====================================================
 *
 * Selector de tipo de división con radio buttons.
 * Muestra descripción y hint para cada tipo.
 *
 * @module moneytags/components/split-ui
 * @author Sistema
 * @version 1.0.0
 */

'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  SPLIT_TYPE_LABELS,
  SPLIT_TYPE_HINTS,
  type SplitType
} from '@/types/expense-splits';
import { Percent, DollarSign, Equal } from 'lucide-react';

interface SplitTypeSelectorProps {
  /** Tipo de split seleccionado */
  value: SplitType;

  /** Callback cuando cambia el tipo */
  onChange: (type: SplitType) => void;

  /** Deshabilitar selector */
  disabled?: boolean;
}

const splitTypeIcons = {
  equal: Equal,
  percentage: Percent,
  exact: DollarSign,
  itemized: DollarSign
};

export function SplitTypeSelector({
  value,
  onChange,
  disabled = false
}: SplitTypeSelectorProps) {
  return (
    <div className='space-y-4'>
      <Label className='text-sm font-medium'>Tipo de División</Label>

      <RadioGroup
        value={value}
        onValueChange={(val) => onChange(val as SplitType)}
        disabled={disabled}
        className='space-y-3'
      >
        {/* División Equitativa */}
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
            value === 'equal'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50'
          }`}
        >
          <RadioGroupItem value='equal' id='split-equal' className='mt-0.5' />
          <div className='flex flex-1 items-start gap-3'>
            <div className='bg-primary/10 text-primary mt-0.5 rounded-md p-2'>
              <Equal className='h-4 w-4' />
            </div>
            <label
              htmlFor='split-equal'
              className='flex-1 cursor-pointer space-y-1'
            >
              <p className='text-sm font-medium'>{SPLIT_TYPE_LABELS.equal}</p>
              <p className='text-muted-foreground text-xs'>
                {SPLIT_TYPE_HINTS.equal}
              </p>
            </label>
          </div>
        </div>

        {/* División por Porcentajes */}
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
            value === 'percentage'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50'
          }`}
        >
          <RadioGroupItem
            value='percentage'
            id='split-percentage'
            className='mt-0.5'
          />
          <div className='flex flex-1 items-start gap-3'>
            <div className='bg-primary/10 text-primary mt-0.5 rounded-md p-2'>
              <Percent className='h-4 w-4' />
            </div>
            <label
              htmlFor='split-percentage'
              className='flex-1 cursor-pointer space-y-1'
            >
              <p className='text-sm font-medium'>
                {SPLIT_TYPE_LABELS.percentage}
              </p>
              <p className='text-muted-foreground text-xs'>
                {SPLIT_TYPE_HINTS.percentage}
              </p>
            </label>
          </div>
        </div>

        {/* División por Montos Exactos */}
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 transition-colors ${
            value === 'exact'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:bg-muted/50'
          }`}
        >
          <RadioGroupItem value='exact' id='split-exact' className='mt-0.5' />
          <div className='flex flex-1 items-start gap-3'>
            <div className='bg-primary/10 text-primary mt-0.5 rounded-md p-2'>
              <DollarSign className='h-4 w-4' />
            </div>
            <label
              htmlFor='split-exact'
              className='flex-1 cursor-pointer space-y-1'
            >
              <p className='text-sm font-medium'>{SPLIT_TYPE_LABELS.exact}</p>
              <p className='text-muted-foreground text-xs'>
                {SPLIT_TYPE_HINTS.exact}
              </p>
            </label>
          </div>
        </div>

        {/* División por Ítems - Futuro (disabled) */}
        <div className='flex items-start gap-3 rounded-lg border border-dashed p-4 opacity-50'>
          <RadioGroupItem
            value='itemized'
            id='split-itemized'
            disabled
            className='mt-0.5'
          />
          <div className='flex flex-1 items-start gap-3'>
            <div className='bg-muted text-muted-foreground mt-0.5 rounded-md p-2'>
              <DollarSign className='h-4 w-4' />
            </div>
            <label
              htmlFor='split-itemized'
              className='flex-1 cursor-not-allowed space-y-1'
            >
              <p className='text-muted-foreground text-sm font-medium'>
                {SPLIT_TYPE_LABELS.itemized}{' '}
                <span className='text-xs'>(Próximamente)</span>
              </p>
              <p className='text-muted-foreground text-xs'>
                {SPLIT_TYPE_HINTS.itemized}
              </p>
            </label>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
