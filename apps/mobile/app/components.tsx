import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BarChart } from '@/components/ui/bar-chart';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CardGroup } from '@/components/ui/card-group';
import { Carousel } from '@/components/ui/carousel';
import { Checkbox } from '@/components/ui/checkbox';
import { Chip } from '@/components/ui/chip';
import { DonutChart } from '@/components/ui/donut-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { LineChart } from '@/components/ui/line-chart';
import { ListRow } from '@/components/ui/list-row';
import { NumberCard } from '@/components/ui/number-card';
import { PageDots } from '@/components/ui/page-dots';
import { PasswordField } from '@/components/ui/password-field';
import { ProgressRing } from '@/components/ui/progress-ring';
import { RadioGroup } from '@/components/ui/radio-group';
import { SearchField } from '@/components/ui/search-field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { Switch } from '@/components/ui/switch';
import { TextField } from '@/components/ui/text-field';
import { BodyText, Caption } from '@/components/ui/text';
import { Subtitle } from '@/components/ui/subtitle';
import { Title } from '@/components/ui/title';
import { TopBar } from '@/components/ui/top-bar';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Caption className="tracking-wide uppercase">{title}</Caption>
      {children}
    </View>
  );
}

const DIVISIONS: { value: 'general' | 'church'; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'church', label: 'La iglesia' },
];

/** Catálogo de los componentes de `components/ui`, por secciones. */
export default function ComponentsScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [division, setDivision] = useState<'general' | 'church'>('general');
  const [city, setCity] = useState<'bogota' | 'medellin' | 'cali'>('bogota');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [chipTags, setChipTags] = useState([
    { id: 'activos', label: 'Activos', selected: true },
    { id: 'nuevos', label: 'Nuevos', selected: false },
  ]);
  const [tagChip, setTagChip] = useState(true);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-8 p-4 pt-16">
      <TopBar title={t('catalog.title')} subtitle={t('catalog.subtitle')} />

      <Section title={t('catalog.typography')}>
        <View className="gap-3">
          <Title size="xl">Title · display</Title>
          <Title>Title · h1</Title>
          <Title size="md">Title · h2</Title>
          <Subtitle>Subtitle · h3</Subtitle>
          <BodyText>BodyText — texto de párrafo regular.</BodyText>
          <Caption>Caption — fechas, ayudas, metadatos.</Caption>
        </View>
      </Section>

      <Section title={t('catalog.icons')}>
        <View className="gap-4">
          <View className="gap-3 flex-row flex-wrap">
            <Icon name="compass" />
            <Icon name="compass" tone="primary" />
            <Icon name="compass" tone="success" />
            <Icon name="compass" tone="warning" />
            <Icon name="compass" tone="destructive" />
            <Icon name="compass" tone="accent" />
          </View>
          <View className="gap-3 flex-row flex-wrap">
            <Icon name="boat" background="soft" />
            <Icon name="boat" background="soft" tone="primary" />
            <Icon name="boat" background="soft" tone="success" shape="square" />
            <Icon name="boat" background="soft" tone="destructive" />
          </View>
        </View>
      </Section>

      <Section title={t('catalog.buttons')}>
        <View className="gap-3">
          <Button title="Primary" />
          <Button title="Secondary" variant="secondary" />
          <Button title="Ghost" variant="ghost" />
          <Button title="Outline" variant="outline" />
          <Button title="Destructive" variant="destructive" />
          <Button title="Link" variant="link" />
          <View className="gap-3 flex-row flex-wrap">
            <Button title="sm" size="sm" />
            <Button title="md" size="md" />
            <Button title="lg" size="lg" />
          </View>
          <View className="gap-3 flex-row flex-wrap">
            <Button title="Buscar" leadingIcon="search" />
            <Button title="Añadir" trailingIcon="add" />
            <Button title="Cargando" loading />
            <IconButton icon="ellipsis-horizontal" accessibilityLabel="Más opciones" />
          </View>
        </View>
      </Section>

      <Section title={t('catalog.inputs')}>
        <View className="gap-3">
          <TextField label="Campo" placeholder="Escribe algo…" />
          <TextField label="Con error" error="Este campo es obligatorio" />
          <PasswordField label="Contraseña" value={password} onChangeText={setPassword} />
          <SearchField value={search} onChangeText={setSearch} placeholder={t('common.search')} />
        </View>
      </Section>

      <Section title={t('catalog.selectors')}>
        <View className="gap-3">
          <SegmentedControl options={DIVISIONS} value={division} onChange={setDivision} />
          <Select
            label="Ciudad"
            placeholder="Elige una ciudad"
            value={city}
            onChange={setCity}
            options={[
              { value: 'bogota', label: 'Bogotá' },
              { value: 'medellin', label: 'Medellín' },
              { value: 'cali', label: 'Cali' },
            ]}
          />
        </View>
      </Section>

      <Section title={t('catalog.controls')}>
        <CardGroup>
          <Checkbox label="Recordarme" checked={checked} onChange={setChecked} />
          <Switch
            label="Notificaciones"
            description="Recibe avisos en el dispositivo"
            checked={enabled}
            onChange={setEnabled}
          />
        </CardGroup>
        <RadioGroup
          value={division}
          onChange={setDivision}
          options={[
            { value: 'general', label: 'General', description: 'Lo personal de cada cual' },
            { value: 'church', label: 'La iglesia', description: 'Lo de la iglesia activa' },
          ]}
        />
      </Section>

      <Section title={t('catalog.badges')}>
        <View className="gap-2 flex-row flex-wrap">
          <Badge label="Muted" />
          <Badge label="Primary" tone="primary" />
          <Badge label="Success" tone="success" icon="checkmark" />
          <Badge label="Warning" tone="warning" />
          <Badge label="Destructive" tone="destructive" />
          <Badge label="Accent" tone="accent" />
        </View>
        <View className="gap-2 flex-row flex-wrap items-center">
          {chipTags.map((chip) => (
            <Chip
              key={chip.id}
              label={chip.label}
              selected={chip.selected}
              onPress={() =>
                setChipTags((tags) =>
                  tags.map((c) => (c.id === chip.id ? { ...c, selected: !c.selected } : c)),
                )
              }
            />
          ))}
          {tagChip ? (
            <Chip
              label="Etiqueta azul"
              color="#2f6fb5"
              onRemove={() => setTagChip(false)}
              removeLabel="Quitar la etiqueta"
            />
          ) : null}
        </View>
      </Section>

      <Section title={t('catalog.cards')}>
        <View className="gap-3">
          <Card title="Card" description="Tarjeta simple con título y descripción">
            <BodyText>Contenido de la tarjeta.</BodyText>
          </Card>

          <CardGroup>
            <ListRow
              leading={<Icon name="people" tone="primary" background="soft" />}
              title="Creyentes"
              subtitle="128 · 4 nuevos"
              trailing={<Badge label="+12" tone="success" />}
              onPress={() => {}}
            />
            <ListRow
              leading={<Icon name="calendar" tone="primary" background="soft" />}
              title="Reuniones"
              subtitle="Esta semana"
              trailing={<Badge label="Hoy" tone="primary" />}
              onPress={() => {}}
            />
            <ListRow
              leading={<Icon name="list" tone="primary" background="soft" />}
              title="Tareas"
              subtitle="3 pendientes"
              onPress={() => {}}
            />
          </CardGroup>

          <View className="gap-3 flex-row">
            <StatCard
              className="flex-1"
              label="Creyentes"
              value="128"
              icon="people"
              change={{ direction: 'up', text: '12%' }}
            />
            <StatCard
              className="flex-1"
              label="Atención"
              value="3"
              icon="warning"
              change={{ direction: 'down', text: '2' }}
            />
          </View>
          <View className="gap-3 flex-row">
            <NumberCard className="flex-1" value="14" label="Días de racha" icon="flame" />
            <NumberCard className="flex-1" value="52" label="Semanas" icon="calendar" />
          </View>
        </View>
      </Section>

      <Section title={t('catalog.charts')}>
        <View className="gap-3">
          <Card title="LineChart">
            <LineChart
              data={[
                { value: 10, label: 'L' },
                { value: 22, label: 'M' },
                { value: 16, label: 'X' },
                { value: 30, label: 'J' },
                { value: 24, label: 'V' },
                { value: 38, label: 'S' },
                { value: 32, label: 'D' },
              ]}
              area
              showDataPoints
            />
          </Card>

          <Card title="BarChart">
            <BarChart
              data={[
                { value: 10, label: 'L' },
                { value: 22, label: 'M' },
                { value: 16, label: 'X' },
                { value: 30, label: 'J' },
              ]}
              showValues
            />
          </Card>

          <View className="gap-3 flex-row items-center justify-around">
            <DonutChart
              size={110}
              data={[
                { value: 6, tone: 'primary' },
                { value: 2, tone: 'success' },
                { value: 1, tone: 'warning' },
              ]}
              centerLabel={<BodyText className="font-sans-semibold">9</BodyText>}
            />
            <ProgressRing progress={0.76} label="76%" />
          </View>

          <Card title="Sparkline">
            <View className="h-10">
              <LineChart
                data={[
                  { value: 4, label: '' },
                  { value: 8, label: '' },
                  { value: 5, label: '' },
                  { value: 12, label: '' },
                ]}
                sparkline
                height={40}
              />
            </View>
          </Card>
        </View>
      </Section>

      <Section title={t('catalog.carousels')}>
        <View className="gap-3">
          <Carousel
            itemWidth={240}
            gap={12}
            onIndexChange={setCarouselIndex}
            testID="carousel-catalog"
          >
            {['Creyentes', 'Reuniones', 'Tareas'].map((label) => (
              <Card key={label} title={label}>
                <BodyText>Tarjeta deslizable del carrusel.</BodyText>
              </Card>
            ))}
          </Carousel>
          <PageDots count={3} activeIndex={carouselIndex} />
        </View>
      </Section>

      <Section title={t('catalog.extras')}>
        <View className="gap-4">
          <View className="gap-3 flex-row items-center">
            <Avatar name="Ana García" />
            <Avatar name="Pedro" tone="success" />
            <Avatar name="María Luz" size="lg" tone="accent" />
          </View>
          <View className="gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-20 rounded-xl" />
          </View>
          <EmptyState
            icon="compass"
            title="Sin registros"
            description="Aquí aparecerá lo que todavía no existe."
            action={{ label: 'Añadir el primero', onPress: () => {} }}
          />
        </View>
      </Section>

      <Section title={t('catalog.navigation')}>
        <TopBar
          title="Título de pantalla"
          subtitle="Subtítulo opcional"
          action={{ icon: 'add', label: 'Añadir', onPress: () => {} }}
        />
      </Section>
    </ScrollView>
  );
}
