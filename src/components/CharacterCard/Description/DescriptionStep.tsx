import { Fragment, useEffect } from 'react';
import { AgeIcon, AlignmentIcon, HeightIcon } from '@assets';
import { Close, Edit } from '@mui/icons-material';
import { Backdrop, IconButton, Paper, Typography } from '@mui/material';
import { Box, Container, type SxProps, type Theme } from '@mui/system';
import { isEqual, omit, sortBy, uniqBy } from 'lodash';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { useToggle } from '@hooks/useToggle';
import { IconText } from '@shared/IconText';
import { type ChoiceSelection, transformFormData } from '@utils/character';
import { getGenderIcon } from '@utils/ui';
import type { CharacterFormData } from '@representations/user.representation';
import { CharacterBackgroundForm } from 'src/components/CharacterCreation/CharacterBackgroundForm';
import type { DefaultProps } from 'src/pages/Header';
import { CharacterDescription, GenderIndexes } from '../../CharacterCreation/CharacterDescription';

export function Description({ character }: DefaultProps) {
  const {
    isOn: isEditDescription,
    turnOn: openEditDescription,
    turnOff: closeEditDescription
  } = useToggle(false);
  const {
    isOn: isEditBackground,
    turnOn: openEditBackground,
    turnOff: closeEditBackground
  } = useToggle(false);
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  useEffect(() => {
    document.body.style.overflow = isEditBackground || isEditDescription ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isEditBackground, isEditDescription]);

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
            const mergedValue = [...nonBackgroundItems, ...value] as ChoiceSelection[];
            return !isEqual(
              sortBy(mergedValue, ['index', 'type']),
              sortBy(originalValue, ['index', 'type'])
            )
              ? {
                  ...result,
                  [key]: uniqBy(mergedValue, (v) => `${v?.type ?? ''}:${v?.index ?? ''}`)
                }
              : result;
          }
        }

        return { ...result, [key]: value };
      },
      {}
    );

    if (Object.keys(updateData).length > 0) await firebaseCrud.update(character.id, updateData);
    closeEditDescription();
    closeEditBackground();
  };

  useEffect(() => {
    if (!isEditBackground && !isEditDescription) return;
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.code === 'Escape') {
        closeEditDescription();
        closeEditBackground();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isEditBackground, isEditDescription, closeEditBackground, closeEditDescription]);

  return (
    <Fragment>
      <Box
        data-testid="description-section"
        display="flex"
        gap="15px"
        flexDirection="column"
        inert={isEditBackground || isEditDescription}
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

        <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={3}>
          {(
            [
              {
                title: 'Appearance',
                testid: 'appearance',
                onEdit: openEditDescription,
                sx: { gridColumn: '1 / -1' }
              },
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

              {(Array.isArray(character[testid])
                ? character[testid]
                : typeof character[testid] === 'string'
                  ? (character[testid] || '').split('\n')
                  : [character[testid]]
              ).map((line, lineIndex) => (
                <Typography
                  key={`${testid}-line-${lineIndex}`}
                  variant={character[testid] ? 'body1' : 'body2'}
                  sx={{ color: !character[testid] ? 'text.secondary' : '' }}
                >
                  {line?.name ?? line ?? 'Not specified'}
                </Typography>
              ))}
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
        open={isEditBackground || isEditDescription}
        onClick={() => (isEditBackground ? closeEditBackground() : closeEditDescription())}
      >
        <IconButton
          data-testid={`close-${isEditBackground ? 'background' : 'description'}-edit`}
          onClick={isEditBackground ? closeEditBackground : closeEditDescription}
          sx={{ position: 'fixed', right: 0, top: 0 }}
        >
          <Close />
        </IconButton>
        <Container maxWidth="md" sx={{ height: '100%' }}>
          <Paper sx={{ padding: 2, paddingBottom: 5 }} onClick={(e) => e.stopPropagation()}>
            {isEditBackground ? (
              <CharacterBackgroundForm
                onNext={onSave}
                defaultData={character}
                proficiencies={character.proficiencies.filter(({ type }) => type !== 'background')}
                languages={character.languages.filter(({ type }) => type !== 'background')}
                equipment={character.equipments.filter(({ type }) => type !== 'background')}
                isActive={isEditBackground}
              />
            ) : (
              <CharacterDescription
                onNext={onSave}
                defaultData={character}
                isActive={isEditDescription}
              />
            )}
          </Paper>
        </Container>
      </Backdrop>
    </Fragment>
  );
}
