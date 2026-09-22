import type { BelieversQuery, BelieverListItem } from '@navis/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { FadeInDown, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { BelieverCard } from '@/components/believers/believer-card';
import { BelieverFormSheet, toInput } from '@/components/believers/believer-form-sheet';
import { BelieversFilters } from '@/components/believers/believers-filters';
import { BelieversScene } from '@/components/believers/believers-scene';
import { NoteComposer } from '@/components/believers/note-composer';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IconButton } from '@/components/ui/icon-button';
import { SearchField } from '@/components/ui/search-field';
import { Select } from '@/components/ui/select';
import { TopBar } from '@/components/ui/top-bar';
import { themeColorsHex } from '@navis/theme';
import { useCongregations, useGifts, useMinistries, useTags } from '@/hooks/use-catalog';
import {
  useBelievers,
  useBelieversSummary,
  useCreateBeliever,
  useSetCongregation,
  useUpdateBeliever,
} from '@/hooks/use-believers';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useStatusBarClaim } from '@/lib/status-bar';
import { useThemeStore } from '@/lib/theme';

const PAGE_SIZE = 20;

/**
 * **Interruptor de prueba** (el flash blanco al volver de una ficha): a
 * `false` el listado queda todo sobre fondo blanco, sin la escena de arcos
 * de la cabecera. Volver a la escena es cambiarlo a `true`: con ella vuelven
 * la barra translúcida, el buscador en vidrio y los filtros `onScene`.
 */
const CON_ESCENA = false;

/**
 * El listado de creyentes (RFC 0003 §7.2): la pregunta de la pantalla es
 * «¿con quién no he hablado?», y la sonda de cada tarjeta la responde de un
 * vistazo. La cabecera lleva la escena náutica del panel —el mar por la hora
 * del saludo, con el buscador y los filtros flotando encima y un parallax
 * suave al hacer scroll—, para que la pantalla no sea un lienzo blanco y la
 * barra de estado tenga su fondo diseñado. Paginación en el repositorio
 * (50 al abrir, de 20 en 20 al hacer scroll), filtros en el estado local —en
 * la web viven en la URL; aquí en la ruta no hay URL— y la única acción en
 * lote que existe a propósito: poner sede.
 */
export default function BelieversScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // El claro de la escena: sobre el azul pleno, el texto y los glifos de la
  // cabecera van en blanco — el del tema no se leería.
  const claro = themeColorsHex[useThemeStore((state) => state.resolvedTheme)].primaryForeground;
  // La entrada animada de las tarjetas corre una sola vez por sesión: al
  // volver de una ficha, las tarjetas que se remontan no vuelven a bailar.
  const primeraCarga = useRef(true);
  useEffect(() => {
    primeraCarga.current = false;
  }, []);
  // La barra de estado la reclama aquí mientras la pantalla tiene el foco:
  // blanca sobre la escena azul de la cabecera y, sin escena, según el tema —
  // reclamar iconos oscuros en modo dark los deja sobre fondo oscuro y la
  // barra desaparece.
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  useStatusBarClaim(CON_ESCENA || resolvedTheme === 'dark' ? 'light' : 'dark');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState<BelieversQuery>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  // Gestos de tarjeta: la nota nueva va con `key` por creyente (los hooks de
  // nota fijan el creyente al montarse) y la edición con el item de la fila.
  const [quickNoteId, setQuickNoteId] = useState<string | null>(null);
  const [quickEdit, setQuickEdit] = useState<BelieverListItem | null>(null);
  // El esqueleto de carga llena lo que quede de pantalla, sin scroll: cuántas
  // tarjetas caben lo dice el alto real del contenedor (`onLayout`), que es el
  // mismo del listado — y mientras no está medido, tres, las que caben seguro.
  const [listHeight, setListHeight] = useState(0);
  const skeletonCount = listHeight > 0 ? Math.max(3, Math.floor((listHeight + 10) / 106)) : 3;
  // El desplazamiento alimenta el parallax de la escena de la cabecera:
  // un valor compartido, sin estado de React — nada de repintar por pixel.
  const scrollY = useSharedValue(0);
  // La regla de inmutabilidad pide la modificación antes del JSX: la lectura
  // del desplazamiento va en el manejador, no en línea sobre el listado.
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  // Sin retardo, cada pulsación relanza la consulta sobre SQLite y varias
  // llamadas nativas solapadas revientan `expo-sqlite` (ver `use-debounced-value`).
  const debouncedSearch = useDebouncedValue(search);
  const filters = useMemo<BelieversQuery>(
    () => ({ ...query, search: debouncedSearch.trim() || undefined, limit: PAGE_SIZE }),
    [query, debouncedSearch],
  );
  const {
    data,
    isPending,
    isError,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBelievers(filters);
  const summary = useBelieversSummary();
  const congregations = useCongregations();
  const gifts = useGifts();
  const tags = useTags();
  const ministries = useMinistries();
  const createBeliever = useCreateBeliever();
  const setSede = useSetCongregation();
  const updateBeliever = useUpdateBeliever();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  function changeFilters(next: BelieversQuery) {
    setQuery(next);
    setSelected([]);
  }

  function changeSearch(text: string) {
    setSearch(text);
  }

  const totalCount = summary.data?.total ?? 0;
  const hasFilters = Boolean(
    search.trim() ||
    query.status ||
    query.attention ||
    query.congregationId ||
    query.giftId ||
    query.tagId ||
    query.ministry,
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
      {CON_ESCENA ? <BelieversScene scrollY={scrollY} /> : null}
      <View className="gap-3 px-4 pb-2">
        <TopBar
          onScene={CON_ESCENA}
          title={t('believers.title')}
          subtitle={t('believers.total', { count: totalCount })}
          actions={[
            {
              icon: 'settings-outline',
              label: t('gifts.manage'),
              onPress: () =>
                router.push({ pathname: '/believers/catalog', params: { tab: 'gifts' } }),
            },
            {
              icon: 'person-add-outline',
              label: t('believers.add'),
              onPress: () => setFormOpen(true),
            },
          ]}
        />
        <SearchField
          value={search}
          onChangeText={changeSearch}
          placeholder={t('believers.search')}
          accessibilityLabel={t('believers.search')}
          {...(CON_ESCENA
            ? {
                containerClassName: 'bg-white/20 border-white/30',
                iconColor: claro,
                placeholderTextColor: claro,
                className: 'text-white',
              }
            : {})}
        />
        <BelieversFilters
          onScene={CON_ESCENA}
          query={query}
          onChange={changeFilters}
          summary={summary.data}
          congregations={congregations.data ?? []}
          gifts={(gifts.data ?? []).map((one) => ({ id: one.id, name: one.name }))}
          tags={(tags.data ?? []).map((one) => ({ id: one.id, name: one.name }))}
          ministries={(ministries.data ?? []).map((one) => ({ id: one.slug, name: one.name }))}
        />
      </View>

      {isPending ? (
        <View
          className="gap-2.5 px-4 flex-1"
          onLayout={(event) => {
            const height = event.nativeEvent.layout.height;
            if (height > 0 && height !== listHeight) setListHeight(height);
          }}
        >
          {Array.from({ length: skeletonCount }, (_, index) => (
            <View key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon="funnel-outline"
            title={t('believers.noResults')}
            description={t('believers.noResultsHint')}
            action={{
              label: t('believers.clearFilters'),
              onPress: () => {
                setSearch('');
                changeFilters({});
              },
            }}
          />
        ) : (
          <EmptyState
            icon="people-outline"
            title={t('believers.empty')}
            description={t('believers.emptyHint')}
            action={{ label: t('believers.add'), onPress: () => setFormOpen(true) }}
          />
        )
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-2.5 px-4 pb-24"
          initialNumToRender={12}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <BelieverCard
              believer={item}
              congregationName={
                congregations.data?.find((one) => one.id === item.congregationId)?.name ?? null
              }
              ministries={ministries.data ?? []}
              index={index}
              selected={selected.includes(item.id)}
              selecting={selected.length > 0}
              onToggleSelect={(id) =>
                setSelected((previous) =>
                  previous.includes(id) ? previous.filter((one) => one !== id) : [...previous, id],
                )
              }
              onPress={(id) => router.push(`/believers/${id}`)}
              onAddNote={(id) => setQuickNoteId(id)}
              onEdit={(believer) => setQuickEdit(believer)}
              animar={primeraCarga.current}
            />
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetching) void fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <Text className="py-3 text-xs text-center text-muted-foreground">…</Text>
            ) : null
          }
        />
      )}

      {selected.length > 0 ? (
        <Animated.View
          entering={FadeInDown.springify()}
          className="gap-2 inset-x-4 rounded-2xl p-3 absolute border border-border bg-card"
          style={{ bottom: insets.bottom + 8 }}
        >
          <View className="gap-2 flex-row items-center justify-between">
            <Text className="text-sm font-sans-medium text-foreground">
              {t('believers.selected', { count: selected.length })}
            </Text>
            <IconButton
              icon="close"
              accessibilityLabel={t('believers.clearSelection')}
              onPress={() => setSelected([])}
            />
          </View>
          <Button title={t('believers.assignCongregation')} onPress={() => setBulkOpen(true)} />
        </Animated.View>
      ) : null}

      <BottomSheet
        visible={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t('believers.assignCongregation')}
      >
        <Select
          label={t('believers.congregation')}
          value=""
          placeholder={t('believers.allCongregations')}
          options={(congregations.data ?? []).map((one) => ({ value: one.id, label: one.name }))}
          onChange={(congregationId) => {
            void setSede.mutateAsync({ ids: selected, congregationId });
            setSelected([]);
            setBulkOpen(false);
          }}
        />
      </BottomSheet>

      <BelieverFormSheet
        visible={formOpen}
        onClose={() => setFormOpen(false)}
        believer={null}
        onSave={async (values) => {
          await createBeliever.mutateAsync(toInput(values));
        }}
      />

      {quickNoteId ? (
        <NoteComposer
          key={quickNoteId}
          believerId={quickNoteId}
          visible
          onClose={() => setQuickNoteId(null)}
        />
      ) : null}

      <BelieverFormSheet
        visible={Boolean(quickEdit)}
        onClose={() => setQuickEdit(null)}
        believer={quickEdit}
        onSave={async (values) => {
          if (!quickEdit) return;
          await updateBeliever.mutateAsync({ id: quickEdit.id, input: toInput(values) });
        }}
      />
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title={t('errors.generic')}
      action={{ label: t('common.retry'), onPress: onRetry }}
    />
  );
}
