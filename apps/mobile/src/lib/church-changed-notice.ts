import { Alert, Platform, ToastAndroid } from 'react-native';
import { i18n } from './i18n';

export function showChurchChanged(name: string): void {
    const text = i18n.t('church.switched', { name });
    if (Platform.OS === 'android') ToastAndroid.show(text, ToastAndroid.SHORT);
    else Alert.alert(text);
}
