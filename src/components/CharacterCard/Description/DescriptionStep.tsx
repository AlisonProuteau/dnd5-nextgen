import { Fragment, useEffect, useState } from 'react';
import { AgeIcon, AlignmentIcon, FemaleIcon, HeightIcon, MaleIcon, OtherIcon } from '@assets';
import { Cancel, Close, Edit, Save } from '@mui/icons-material';
import { Backdrop, IconButton, Paper, Typography } from '@mui/material';
import { Box, Container, type SxProps, type Theme } from '@mui/system';
import { isEqual, omit, sortBy, uniq } from 'lodash';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { ControledInput } from '@shared/ControledInput';
import { IconText } from '@shared/IconText';
import { transformFormData } from '@utils/character';
import type { CharacterFormData } from '@representations/user.representation';
import { CharacterBackgroundForm } from 'src/components/CharacterCreation/CharacterBackgroundForm';
import type { DefaultProps } from 'src/pages/Header';
import { GenderIndexes } from '../../CharacterCreation/CharacterDescription';

export function Description({ character }: DefaultProps) {
  const [isEditAppearance, toggleEditAppearance] = useState(false);
  const {
    isOn: isEditBackground,
    turnOn: openEditBackground,
    turnOff: closeEditBackground
  } = useToggle(false);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  const onSave = async (update: Partial<CharacterFormData>) => {
    const formattedData = {
      ...character,
      ...omit(transformFormData(update), ['level'])
    };

    const updateData = Object.entries(formattedData).reduce<Record<string, any>>(
      (result, [key, value]) => {
        const originalValue = character[key as keyof typeof character];
        if (isEqual(value, originalValue)) return result;

        if (Array.isArray(value) && Array.isArray(originalValue)) {
          const nonBackgroundItems = originalValue.filter(
            (item: any) =>
              typeof item === 'object' && (!('type' in item) || item.type !== 'background')
          );
          if (nonBackgroundItems.length) {
            const mergedValue = [...nonBackgroundItems, ...value];
            return !isEqual(
              sortBy(mergedValue, ['index', 'type']),
              sortBy(originalValue, ['index', 'type'])
            )
              ? { ...result, [key]: uniq(mergedValue) }
              : result;
          }
        }

        return { ...result, [key]: value };
      },
      {}
    );

    if (Object.keys(updateData).length > 0) await firebaseCrud.update(character.id, updateData);
    toggleEditAppearance(false);
    closeEditBackground();
  };

  const getGenderIcon = (genderIndex: GenderIndexes) => {
    switch (genderIndex) {
      case GenderIndexes.female:
        return FemaleIcon;
      case GenderIndexes.male:
        return MaleIcon;
      default:
        return OtherIcon;
    }
  };

  useEffect(() => {
    document.body.style.overflow = isEditBackground ? 'hidden' : 'auto';

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isEditBackground]);

  return (
    <Fragment>
      <Box
        data-testid="description-section"
        display="flex"
        gap="15px"
        flexDirection="column"
        inert={isEditBackground}
      >
        <Box display="grid" gridTemplateColumns="1fr 1fr 1fr 1fr" alignItems="end">
          <IconText
            label="Sex"
            Icon={getGenderIcon((character.sex?.index as GenderIndexes) || GenderIndexes.other)}
            color="grey"
            top="0px"
            testid={`description-sex-${character.sex?.index || GenderIndexes.other}`}
          />
          <IconText
            label="Age"
            value={character.age}
            Icon={AgeIcon}
            color="grey"
            top="45px"
            testid="description-age"
          />
          <IconText
            label="Size"
            value={character.size}
            Icon={HeightIcon}
            color="lightgrey"
            testid="description-size"
          />
          <IconText
            label="Alignment"
            value={character.alignment.abbreviation}
            Icon={AlignmentIcon}
            color="grey"
            testid="description-alignment"
          />
        </Box>

        <Box data-testid={`description-appearance`} gap={1} alignItems="baseline">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const newValue = (e.target as HTMLFormElement).appearance.value;
              onSave({
                appearance: Array.isArray(newValue) ? newValue.join('\n') : newValue || ''
              });
            }}
            onReset={() => toggleEditAppearance(!isEditAppearance)}
          >
            <Typography variant="subtitle2" color="primary" display="inline-block">
              Appearance
            </Typography>

            <Box display="inline" marginLeft={1}>
              {isEditAppearance && (
                <IconButton
                  color="primary"
                  type="submit"
                  disabled={firebaseCrud.isLoading}
                  data-testid={'description-appearance-save'}
                >
                  <Save fontSize="small" />
                </IconButton>
              )}

              <IconButton
                color={isEditAppearance ? 'secondary' : 'primary'}
                type="reset"
                disabled={firebaseCrud.isLoading}
                data-testid={`description-appearance-${isEditAppearance ? 'cancel' : 'edit'}`}
              >
                {isEditAppearance ? <Cancel fontSize="small" /> : <Edit fontSize="small" />}
              </IconButton>
            </Box>

            {isEditAppearance ? (
              <ControledInput
                fullWidth
                multiline
                id="appearance"
                label="Appearance"
                defaultValue={character.appearance || ''}
              />
            ) : (
              character.appearance?.split('\n').map((line, lineIndex) => (
                <Typography key={`appearance-line-${lineIndex}`} variant="body1" display="block">
                  {line}
                </Typography>
              )) || (
                <Typography variant={'body2'} sx={{ color: 'text.secondary' }}>
                  Not specified
                </Typography>
              )
            )}
          </form>
        </Box>

        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={3}>
          {(
            [
              {
                title: 'Background',
                testid: 'background',
                onEdit: openEditBackground,
                sx: { gridColumn: '1 / -1' }
              },
              { title: 'Bonds', testid: 'bonds' },
              { title: 'Personality', testid: 'personality' },
              { title: 'Ideals', testid: 'ideals' },
              { title: 'Flaws', testid: 'flaws' }
            ] as {
              title: string;
              testid: keyof CharacterFormData;
              onEdit?: () => void;
              sx?: SxProps<Theme>;
            }[]
          ).map(({ title, testid, onEdit, sx }) => (
            <Box key={testid} data-testid={`description-${testid}`} width="100%" sx={sx}>
              <Typography variant="subtitle2" color="primary" display="inline-block">
                {title}
              </Typography>

              {onEdit && (
                <IconButton
                  color="primary"
                  onClick={onEdit}
                  sx={{ ml: 1 }}
                  disabled={firebaseCrud.isLoading}
                  data-testid={`description-${testid}-edit`}
                >
                  <Edit fontSize="small" />
                </IconButton>
              )}

              {(Array.isArray(character[testid]) ? character[testid] : [character[testid]]).map(
                (line, lineIndex) => (
                  <Typography
                    key={`${testid}-line-${lineIndex}`}
                    variant={character[testid] ? 'body1' : 'body2'}
                    sx={{ color: !character[testid] ? 'text.secondary' : '' }}
                  >
                    {line?.name ?? line ?? 'Not specified'}
                  </Typography>
                )
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Backdrop
        sx={(theme) => ({
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderTop: 'solid 16px transparent',
          borderBottom: 'solid 16px transparent',
          overflow: 'auto'
        })}
        open={isEditBackground}
        onClick={closeEditBackground}
      >
        <IconButton
          data-testid="close-background-edit"
          onClick={closeEditBackground}
          sx={{ position: 'fixed', right: 0, top: 0 }}
        >
          <Close />
        </IconButton>
        <Container maxWidth="md" sx={{ height: '100%' }}>
          <Paper sx={{ padding: 2 }} onClick={(e) => e.stopPropagation()}>
            <CharacterBackgroundForm
              onNext={onSave}
              defaultData={character}
              proficiencies={character.proficiencies.filter(({ type }) => type !== 'background')}
              languages={character.languages.filter(({ type }) => type !== 'background')}
              equipment={character.equipments.filter(({ type }) => type !== 'background')}
              isActive={isEditBackground}
            />
          </Paper>
        </Container>
      </Backdrop>
    </Fragment>
  );
}
