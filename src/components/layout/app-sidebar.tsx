'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { navItems, navItemsTools, navItemsOthers } from '@/constants/data';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ArrowRight01Icon } from 'hugeicons-react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { BalanceWidget } from '../balance-widget';
import { QuickStatsSidebar } from '../quick-stats-sidebar';
interface AppSidebarProps {
  stats?: {
    totalBalance: number;
    monthlyChange: number;
    changePercentage: number;
    todayExpenses: number;
    monthExpenses: number;
    pendingPayments: number;
    moneyTagsCount: number;
  };
}

export default function AppSidebar({ stats: initialStats }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen } = useMediaQuery();
  const { open: sidebarOpen } = useSidebar();

  // Valores por defecto si no se pasan stats
  const stats = initialStats || {
    totalBalance: 4193000,
    monthlyChange: 589950,
    changePercentage: 15.2,
    todayExpenses: 50000,
    monthExpenses: 410000,
    pendingPayments: 3,
    moneyTagsCount: 2
  };

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  const handleNewTransaction = () => {
    router.push('/dashboard/transacciones?new=true');
  };

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        {sidebarOpen ? (
          <>
            <BalanceWidget
              totalBalance={stats.totalBalance}
              monthlyChange={stats.monthlyChange}
              changePercentage={stats.changePercentage}
            />
            <div className='px-2 py-2'>
              <Button
                className='w-full justify-start gap-2'
                size='sm'
                onClick={handleNewTransaction}
              >
                <Plus className='size-4' />
                <span>Nueva Transacción</span>
              </Button>
            </div>
          </>
        ) : (
          <div className='flex items-center justify-center py-4'>
            <Button
              size='icon'
              variant='default'
              onClick={handleNewTransaction}
              className='size-10'
            >
              <Plus className='size-5' />
            </Button>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        {/* Quick Stats - Solo cuando está expandido */}
        {sidebarOpen && (
          <QuickStatsSidebar
            todayExpenses={stats.todayExpenses}
            monthExpenses={stats.monthExpenses}
            pendingPayments={stats.pendingPayments}
          />
        )}

        {/* Principal Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <ArrowRight01Icon className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Herramientas */}
        <SidebarGroup>
          <SidebarGroupLabel>Herramientas</SidebarGroupLabel>
          <SidebarMenu>
            {navItemsTools.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link
                      href={item.url}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-2'>
                        <Icon />
                        <span>{item.title}</span>
                      </div>
                      {item.title === 'MoneyTags' &&
                        stats.moneyTagsCount > 0 && (
                          <span className='bg-primary text-primary-foreground min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-xs font-semibold'>
                            {stats.moneyTagsCount}
                          </span>
                        )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>

        {/* Otros */}
        <SidebarGroup>
          <SidebarGroupLabel>Otros</SidebarGroupLabel>
          <SidebarMenu>
            {navItemsOthers.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
