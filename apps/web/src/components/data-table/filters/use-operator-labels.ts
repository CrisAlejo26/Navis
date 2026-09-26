import type { TableOperator } from '@navis/shared';
import { useTranslation } from 'react-i18next';

/** El nombre de cada condición, en el idioma activo. Una por una: la Regla 2 prohíbe construir claves. */
export function useOperatorLabels(): Record<TableOperator, string> {
    const { t } = useTranslation();
    return {
        contains: t('dataTable.operators.contains'),
        equals: t('dataTable.operators.equals'),
        startsWith: t('dataTable.operators.startsWith'),
        isEmpty: t('dataTable.operators.isEmpty'),
        isNotEmpty: t('dataTable.operators.isNotEmpty'),
        gt: t('dataTable.operators.gt'),
        lt: t('dataTable.operators.lt'),
        between: t('dataTable.operators.between'),
        on: t('dataTable.operators.on'),
        before: t('dataTable.operators.before'),
        after: t('dataTable.operators.after'),
        in: t('dataTable.operators.in'),
        notIn: t('dataTable.operators.notIn'),
        is: t('dataTable.operators.is'),
    };
}
