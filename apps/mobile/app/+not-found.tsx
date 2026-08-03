import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <View className="gap-3 p-6 flex-1 items-center justify-center bg-background">
      <Text className="text-xl font-semibold text-foreground">{t('errors.notFound')}</Text>
      <Link href="/" className="text-base text-primary">
        {t('common.back')}
      </Link>
    </View>
  );
}
