'use client';

import { useState } from 'react';
import { useSmartMonitagSearch } from '@/hooks/monitags';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, ChevronsUpDown, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMonitag } from '@/lib/validations/monitag';
import type { MonitagSearchResult } from '@/lib/actions';

interface MonitagSearchComboboxProps {
  value?: string; // monitag seleccionado
  onSelect: (result: MonitagSearchResult) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Combobox para buscar y seleccionar @monitags
 *
 * Características:
 * - Búsqueda fuzzy en tiempo real
 * - Sugerencias si no hay resultados
 * - Avatar y nombre del usuario
 * - Indicador de similitud
 * - Loading states
 */
export function MonitagSearchCombobox({
  value,
  onSelect,
  placeholder = 'Buscar @monitag...',
  disabled = false,
  className
}: MonitagSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { results, isSearching, suggestions, isEmpty, hasResults } =
    useSmartMonitagSearch(query);

  const handleSelect = (result: MonitagSearchResult) => {
    onSelect(result);
    setOpen(false);
    setQuery('');
  };

  // Buscar el resultado seleccionado actualmente
  const selectedResult = results.find((r) => r.monitag === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
          disabled={disabled}
        >
          {selectedResult ? (
            <div className='flex items-center gap-2'>
              <Avatar className='h-5 w-5'>
                <AvatarImage src={selectedResult.avatar_url ?? undefined} />
                <AvatarFallback className='text-xs'>
                  {selectedResult.monitag[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className='truncate'>
                {formatMonitag(selectedResult.monitag)}
              </span>
            </div>
          ) : (
            <span className='text-muted-foreground'>{placeholder}</span>
          )}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[var(--radix-popover-trigger-width)] p-0'>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder='Buscar @monitag...'
            value={query}
            onValueChange={setQuery}
            className='h-9'
          />

          <CommandList>
            {/* Loading */}
            {isSearching && (
              <div className='flex items-center justify-center py-6'>
                <Search className='text-muted-foreground h-4 w-4 animate-pulse' />
                <span className='text-muted-foreground ml-2 text-sm'>
                  Buscando...
                </span>
              </div>
            )}

            {/* Resultados */}
            {!isSearching && hasResults && (
              <CommandGroup heading='Resultados'>
                {results.map((result) => (
                  <CommandItem
                    key={result.profile_id}
                    value={result.monitag}
                    onSelect={() => handleSelect(result)}
                    className='cursor-pointer'
                  >
                    <div className='flex flex-1 items-center gap-2'>
                      <Avatar className='h-6 w-6'>
                        <AvatarImage src={result.avatar_url ?? undefined} />
                        <AvatarFallback className='text-xs'>
                          {result.monitag[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1'>
                        <p className='text-sm font-medium'>
                          {formatMonitag(result.monitag)}
                        </p>
                        <p className='text-muted-foreground text-xs'>
                          {result.full_name}
                        </p>
                      </div>

                      {/* Indicador de match */}
                      {result.similarity > 0.8 && (
                        <div className='bg-primary/10 rounded-full px-2 py-0.5'>
                          <span className='text-primary text-xs font-medium'>
                            {Math.round(result.similarity * 100)}%
                          </span>
                        </div>
                      )}

                      {value === result.monitag && (
                        <Check className='text-primary h-4 w-4' />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Empty state con sugerencias */}
            {!isSearching && isEmpty && query.length >= 2 && (
              <>
                <CommandEmpty>
                  <div className='py-6 text-center'>
                    <Search className='text-muted-foreground mx-auto h-8 w-8' />
                    <p className='mt-2 text-sm font-medium'>
                      No se encontró "{formatMonitag(query)}"
                    </p>
                    <p className='text-muted-foreground mt-1 text-xs'>
                      Verifica que el @monitag sea correcto
                    </p>
                  </div>
                </CommandEmpty>

                {suggestions.length > 0 && (
                  <CommandGroup heading='¿Quisiste decir?'>
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion}
                        value={suggestion}
                        onSelect={() => setQuery(suggestion)}
                        className='cursor-pointer'
                      >
                        <Sparkles className='text-muted-foreground mr-2 h-4 w-4' />
                        <span className='text-sm'>
                          {formatMonitag(suggestion)}
                        </span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}

            {/* Prompt inicial */}
            {query.length < 2 && (
              <div className='text-muted-foreground py-6 text-center text-sm'>
                Ingresa al menos 2 caracteres para buscar
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
