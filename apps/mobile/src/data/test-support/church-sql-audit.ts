import ts from 'typescript';
import { LOCAL_TABLES, LOCAL_TASK_TABLES } from '@navis/shared';

const parents = [
    'believer_tag_links',
    'believer_gifts',
    'believer_ministries',
    'pattern_phases',
    'meeting_slots',
    'meeting_slot_believers',
    'task_occurrences',
    'task_tags',
    'habit_tags',
    'habit_occurrences',
    'task_reminders',
    'habit_reminders',
    'task_reminder_tags',
    'habit_reminder_tags',
    'custom_table_columns',
    'custom_table_rows',
    'custom_table_views',
];
const scoped = new Set([
    'custom_tables',
    ...[...LOCAL_TABLES, ...LOCAL_TASK_TABLES]
        .filter((table) => table.columns.some((column) => column.name === 'church_id'))
        .map((table) => table.name),
    ...parents,
]);
// B6 comprueba que los llamadores validan padres y personas antes de usar helpers.
const exceptions: Record<string, string> = {
    'table-password-migration.ts:encryptExistingColumn':
        'Helper interno llamado por saveColumn con tableDb autorizado; filas restringidas a table_id en transacción.',
    'table-believers.ts:addTableBelievers':
        'tableDb autoriza propietario y padre; cada creyente se valida en la misma iglesia antes de insertar en transacción.',
    'tables-reads.ts:readTable': 'tableDb autoriza tabla e iglesia antes de leer sus columnas.',
    'tables-reads.ts:readTableViews':
        'tableDb autoriza el padre antes de leer vistas por table_id.',
    'table-columns.ts:saveColumn':
        'tableDb exige propietario y padre; el id de columna se resuelve en readTable autorizado.',
    'table-columns.ts:deleteColumn':
        'tableDb exige propietario y padre; UPDATE restringido a id y table_id.',
    'table-columns.ts:reorderColumns':
        'tableDb exige propietario; conjunto completo de hijos verificado dentro de transacción.',
    'table-views.ts:createView':
        'tableDb exige propietario y padre; columna y consulta validadas contra readTable.',
    'table-views.ts:updateView':
        'tableDb exige propietario; vista resuelta en listado autorizado y UPDATE por id/table_id.',
    'table-views.ts:deleteView': 'tableDb exige propietario; UPDATE por id/table_id.',
    'table-rows.ts:createTableRow':
        'tableDb exige propietario y padre; creyente validado por iglesia antes de insertar.',
    'table-rows.ts:updateTableRow':
        'tableDb exige propietario; fila leída y actualizada por id/table_id.',
    'table-rows.ts:deleteTableRow': 'tableDb exige propietario; UPDATE por id/table_id.',
    'table-rows-read.ts:revealPassword':
        'tableDb exige propietario y padre; columna y fila validadas por table_id.',
    'note-reminders-repo.ts:listPendingNoteReminders':
        'Avisos multiiglesia: usuario y membresía vigente por EXISTS; creyente y nota de la misma iglesia.',
    'church-access.ts:listMyChurches':
        'Lista de acceso: se acota por usuario y membresía explícita, antes de elegir iglesia.',
    'calendar-slot-people.ts:peopleBySlot':
        'Helper interno: reuniones y fases validadas por su llamador.',
    'calendar-slot-people.ts:replaceSlotPeople':
        'Helper interno: reunión y creyentes validados por su llamador.',
};
function enclosingFunction(node: ts.Node): string {
    for (let current: ts.Node | undefined = node.parent; current; current = current.parent) {
        if (ts.isFunctionDeclaration(current)) return current.name?.text ?? '<anonymous>';
        if (ts.isMethodDeclaration(current)) return current.name.getText();
    }
    return '<module>';
}

export function unscopedChurchSql(content: string, file: string): string[] {
    const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
    const constants = new Map<string, string>();
    const collect = (node: ts.Node) => {
        if (
            ts.isVariableDeclaration(node) &&
            ts.isIdentifier(node.name) &&
            node.initializer &&
            (ts.isStringLiteral(node.initializer) ||
                ts.isNoSubstitutionTemplateLiteral(node.initializer))
        ) {
            constants.set(node.name.text, node.initializer.text);
        }
        ts.forEachChild(node, collect);
    };
    collect(source);
    const violations: string[] = [];
    const inspect = (sql: string, node: ts.Node) => {
        if (!/^\s*(SELECT|UPDATE|DELETE|INSERT)\b/i.test(sql)) return;
        const tables = [...sql.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO)\s+([a-z_]+)/gi)].map(
            (match) => match[1],
        );
        const dynamicTable = /\b(?:FROM|JOIN|UPDATE|INTO)\s+\$\{/.test(sql);
        if (!dynamicTable && !tables.some((table) => table && scoped.has(table))) return;
        if (exceptions[`${file}:${enclosingFunction(node)}`]) return;
        const scopedWhere = /\b(?:WHERE|ON)[\s\S]*\bchurch_id\s*=\s*\?/i.test(sql);
        const scopedInsert = /\bINSERT\s+INTO\s+(?:\w+|\$\{[^}]+\})\s*\([^)]*\bchurch_id\b/i.test(
            sql,
        );
        const dynamicWhere =
            /\bWHERE\s+\$\{(?:clauses\.join|where\b)/.test(sql) &&
            content.includes(
                "'" + (file === 'believers-repo.ts' ? 'b.' : 'n.') + 'church_id = ?' + "'",
            );
        if (scopedWhere || scopedInsert || dynamicWhere) return;
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        violations.push(
            `${file}:${line} (${enclosingFunction(node)}): ${sql.replace(/\s+/g, ' ').trim()}`,
        );
    };
    const visit = (node: ts.Node) => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
            inspect(node.text, node);
        else if (ts.isTemplateExpression(node)) {
            const sql =
                node.head.text +
                node.templateSpans
                    .map((span) => {
                        const expression = span.expression.getText(source);
                        return (
                            (constants.get(expression) ?? '${' + expression + '}') +
                            span.literal.text
                        );
                    })
                    .join('');
            inspect(sql, node);
            return;
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return violations;
}
