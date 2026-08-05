import { BarChart3, Download, Share2, UserPlus, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ListDialogs, type ListDialog } from '@/components/lists/list-dialogs';
import { ListHeader } from '@/components/lists/list-header';
import { ListStats } from '@/components/lists/list-stats';
import { MemberRows } from '@/components/lists/member-rows';
import { SharePanel } from '@/components/lists/share-panel';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Tabs } from '@/components/ui/tabs';
import { useChurches } from '@/lib/churches';
import { useListScreen, type ListTab } from '@/lib/lists/use-list-screen';
import { usePermissions } from '@/lib/permissions';

/**
 * La ficha de una lista (RFC 0010 §8.3).
 *
 * Cabecera **a sangre en el color de la lista** y tres pestañas: Personas,
 * Estadísticas y Compartir. La pestaña vive en la URL para que un enlace a
 * «Compartir» se pueda pegar en un mensaje.
 */
export function ListPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { active } = useChurches();
  const { detail, isLoading, notFound, tab, setTab } = useListScreen();
  const [dialog, setDialog] = useState<ListDialog>(null);

  if (isLoading) return <PageSkeleton />;
  if (notFound || !detail) {
    return <p className="text-sm text-muted-foreground">{t('lists.notFound')}</p>;
  }

  const editable = can('lists.manage');
  const abrir = (one: ListDialog) => () => {
    setDialog(one);
  };

  const tabs = [
    {
      value: 'people' as const,
      label: t('lists.tabPeople'),
      icon: Users,
      count: detail.members.length,
    },
    { value: 'stats' as const, label: t('lists.tabStats'), icon: BarChart3 },
    ...(can('lists.share')
      ? [{ value: 'share' as const, label: t('lists.tabShare'), icon: Share2 }]
      : []),
  ];

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <ListHeader
        list={detail}
        onEdit={editable ? abrir('edit') : undefined}
        onDelete={editable ? abrir('delete') : undefined}
      />

      <Tabs
        items={tabs}
        value={tab}
        label={t('lists.title')}
        onChange={(value: ListTab) => {
          setTab(value);
        }}
      />

      {tab === 'people' && (
        <div className="gap-4 flex flex-col">
          <div className="gap-2 flex flex-wrap">
            {editable && (
              <Button size="lg" onClick={abrir('members')}>
                <UserPlus size={16} aria-hidden />
                {t('lists.addPeople')}
              </Button>
            )}
            <Button variant="secondary" onClick={abrir('export')}>
              <Download size={15} aria-hidden />
              {t('export.title')}
            </Button>
          </div>

          <MemberRows listId={detail.id} members={detail.members} editable={editable} />
        </div>
      )}

      {tab === 'stats' && <ListStats list={detail} />}

      {tab === 'share' && can('lists.share') && (
        <SharePanel list={detail} churchName={active?.name ?? ''} members={detail.members} />
      )}

      <ListDialogs
        list={detail}
        churchName={active?.name ?? ''}
        open={dialog}
        onClose={() => {
          setDialog(null);
        }}
      />
    </section>
  );
}
