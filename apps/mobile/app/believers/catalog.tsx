import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, View } from 'react-native';

import { CatalogFormSheet } from '@/components/believers/catalog-form-sheet';
import { CatalogSection, type CatalogEntry } from '@/components/believers/catalog-section';
import { AppBar } from '@/components/ui/app-bar';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useCatalogMutation, useGifts, useMinistries, useTags } from '@/hooks/use-catalog';

type CatalogTab = 'gifts' | 'ministries' | 'tags';

/**
 * Los catálogos de la iglesia (D5, §7.2): dones, labores y etiquetas en una
 * sola pantalla con segmentos — tres rutas de la web en una, porque en el
 * teléfono son la misma lista con otro título. La pestaña inicial llega por
 * parámetro, así que el listado puede abrir directo en la que toca.
 */
export default function CatalogScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<CatalogTab>(() => {
    const requested = params.tab;
    return requested === 'ministries' || requested === 'tags' ? requested : 'gifts';
  });
  const gifts = useGifts();
  const ministries = useMinistries();
  const tags = useTags();
  const { create, update, remove } = useCatalogMutation();
  const [formEntry, setFormEntry] = useState<CatalogEntry | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Las claves de i18n siguen al catálogo: dones y labores tienen sección
  // propia; las etiquetas viven en `believerTags.*`.
  const prefix = tab === 'tags' ? 'believerTags' : tab;
  const entries: CatalogEntry[] =
    tab === 'gifts'
      ? (gifts.data ?? [])
      : tab === 'ministries'
        ? (ministries.data ?? [])
        : (tags.data ?? []);

  function openForm(entry: CatalogEntry | null) {
    setFormEntry(entry);
    setFormError(null);
    setFormOpen(true);
  }

  async function save(name: string) {
    if (name.length < 2) {
      setFormError(t(`${prefix}.name`));
      return;
    }
    try {
      if (formEntry) {
        await update.mutateAsync({ kind: tab, id: formEntry.id, input: { name } });
      } else {
        await create.mutateAsync({ kind: tab, input: { name } });
      }
    } catch {
      // El repo lanza «duplicate» cuando el nombre ya existe (como la API).
      setFormError(t(`${prefix}.duplicate`));
      throw new Error('duplicate');
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* El título sigue al segmento: siempre dice qué catálogo se administra. */}
      <AppBar title={t(`${prefix}.title`)} />
      <ScrollView contentContainerClassName="gap-4 px-4 pb-10">
        <Text className="text-sm text-muted-foreground">{t(`${prefix}.description`)}</Text>
        <SegmentedControl
          value={tab}
          onChange={setTab}
          options={[
            { value: 'gifts', label: t('gifts.title') },
            { value: 'ministries', label: t('ministries.title') },
            { value: 'tags', label: t('believerTags.title') },
          ]}
        />

        <Button title={t(`${prefix}.add`)} leadingIcon="add" onPress={() => openForm(null)} />

        <CatalogSection
          entries={entries}
          emptyText={t(`${prefix}.empty`)}
          deleteTitle={(name) => t(`${prefix}.deleteTitle`, { name })}
          deleteBody={t(`${prefix}.deleteBody`)}
          onEdit={openForm}
          onToggle={(entry) =>
            void update.mutateAsync({
              kind: tab,
              id: entry.id,
              input: { isActive: !entry.isActive },
            })
          }
          onDelete={(entry) => void remove.mutateAsync({ kind: tab, id: entry.id })}
        />
      </ScrollView>

      <CatalogFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        title={t(formEntry ? `${prefix}.edit` : `${prefix}.add`)}
        nameLabel={t(`${prefix}.name`)}
        initialName={formEntry?.name ?? ''}
        error={formError}
        saving={create.isPending || update.isPending}
        onSave={save}
      />
    </View>
  );
}
