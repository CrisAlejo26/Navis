import { proposeListUsername } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { PasswordField } from '@/components/lists/password-field';
import {
  ViewerBelieverPicker,
  type PickableBeliever,
} from '@/components/lists/viewer-believer-picker';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';

export interface ViewerDraft {
  deCreyente: boolean;
  believer: PickableBeliever | null;
  label: string;
  username: string;
  password: string;
}

/**
 * Los campos del diálogo de crear un acceso (RFC 0010 §8.5).
 *
 * **De quién es** primero, porque es lo que rellena todo lo demás: elegir a la
 * persona pone la etiqueta y propone el usuario (D20). La contraseña nace ya
 * generada (D25) y el usuario va con `autocapitalize="none"`, que en un móvil es
 * el fallo número uno.
 */
export function ViewerFormFields({
  draft,
  onChange,
}: {
  draft: ViewerDraft;
  onChange: (draft: ViewerDraft) => void;
}) {
  const { t } = useTranslation();

  const set = (patch: Partial<ViewerDraft>) => {
    onChange({ ...draft, ...patch });
  };

  return (
    <>
      <div className="gap-1.5 flex">
        <Chip
          active={draft.deCreyente}
          onClick={() => {
            set({ deCreyente: true });
          }}
        >
          {t('lists.forBeliever')}
        </Chip>
        <Chip
          active={!draft.deCreyente}
          onClick={() => {
            set({ deCreyente: false, believer: null });
          }}
        >
          {t('lists.forGroup')}
        </Chip>
      </div>

      {draft.deCreyente && (
        <ViewerBelieverPicker
          value={draft.believer}
          onPick={(person) => {
            const name = `${person.firstName} ${person.lastName}`.trim();
            set({ believer: person, label: name, username: proposeListUsername(name) });
          }}
        />
      )}

      <Input
        name="label"
        label={t('lists.viewerLabel')}
        value={draft.label}
        onChange={(event) => {
          const label = event.target.value;
          set(draft.deCreyente ? { label } : { label, username: proposeListUsername(label) });
        }}
        required
      />

      <Input
        name="username"
        label={t('lists.username')}
        value={draft.username}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        onChange={(event) => {
          set({ username: event.target.value });
        }}
        required
      />

      <PasswordField
        value={draft.password}
        onChange={(password) => {
          set({ password });
        }}
      />
    </>
  );
}
