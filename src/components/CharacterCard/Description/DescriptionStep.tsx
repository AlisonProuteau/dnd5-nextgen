import { Fragment, useEffect, useState } from 'react';
import { AgeIcon, AlignmentIcon, FemaleIcon, HeightIcon, MaleIcon, OtherIcon } from '@assets';
import { Delete, Edit, Save } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useFirebaseCrud } from '@hooks/useFirebaseCrud';
import { ControledInput } from '@shared/ControledInput';
import { IconText } from '@shared/IconText';
import type { DefaultProps } from 'src/pages/Header';
import { GenderIndexes } from '../../CharacterCreation/CharacterDescription';

export function Description({ character }: DefaultProps) {
  const [isEdit, toggleEdit] = useState<Record<string, boolean>>({});
  const [currentContent, setCurrentContent] = useState<Record<string, string | string[] | null>>({
    background: character.background.name || null,
    appearance: character.appearance || null,
    personality: character.personality || null,
    ideals: character.ideals || null,
    bonds: character.bonds || null,
    flaws: character.flaws || null
  });
  const firebaseCrud = useFirebaseCrud({
    collectionPath: 'users/{userId}/characters',
    invalidateQueryKey: ['fetchCharacter', '{userId}', character.id]
  });

  useEffect(
    () =>
      setCurrentContent({
        background: character.background.name || null,
        appearance: character.appearance || null,
        personality: character.personality || null,
        ideals: character.ideals || null,
        bonds: character.bonds || null,
        flaws: character.flaws || null
      }),
    [character]
  );

  const onSave = (testid: string, singleLine?: boolean) => {
    if (
      isEdit[testid] &&
      currentContent[testid] !== (character[testid as keyof typeof character] || null)
    ) {
      const valueAsString = Array.isArray(currentContent[testid])
        ? currentContent[testid].join('\n')
        : currentContent[testid];
      firebaseCrud.update(character.id, {
        [testid]: valueAsString && !singleLine ? valueAsString.split('\n') : valueAsString
      });
    }
    toggleEdit({ ...isEdit, [testid]: !isEdit[testid] });
  };

  const onCancel = (testid: string) => {
    setCurrentContent({
      ...currentContent,
      [testid]: (character[testid as keyof typeof character] as string | string[]) || null
    });
    toggleEdit({ ...isEdit, [testid]: !isEdit[testid] });
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

  return (
    <Box data-testid="description-section" display="flex" gap="15px" flexDirection="column">
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

      <Box
        key="background"
        data-testid={`description-background`}
        display="flex"
        alignItems="baseline"
        gap={1}
      >
        <Typography variant="subtitle2" color="primary" display="inline-block">
          Background
        </Typography>
        <Typography
          variant={currentContent.background ? 'body1' : 'body2'}
          sx={{ color: !currentContent.background ? 'text.secondary' : '' }}
        >
          {currentContent.background ?? 'Not specified'}
        </Typography>
      </Box>

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(500px, 1fr))" gap={3}>
        {[
          { title: 'Appearance', testid: 'appearance', singleLine: true },
          { title: 'Personality', testid: 'personality' },
          { title: 'Ideals', testid: 'ideals' },
          { title: 'Bonds', testid: 'bonds' },
          { title: 'Flaws', testid: 'flaws' }
        ].map(({ title, testid, singleLine }) => (
          <Box key={testid} data-testid={`description-${testid}`}>
            <Typography variant="subtitle2" color="primary" display="inline-block">
              {title}
            </Typography>

            <Fragment>
              <IconButton
                color="primary"
                onClick={() => onSave(testid, singleLine)}
                sx={{ ml: 1 }}
                disabled={
                  firebaseCrud.isLoading ||
                  Object.entries(isEdit).some(([key, value]) => key !== testid && value)
                }
                data-testid={`description-${testid}-${!isEdit[testid] ? 'edit' : 'save'}-button`}
              >
                {isEdit[testid] ? <Save fontSize="small" /> : <Edit fontSize="small" />}
              </IconButton>
              {isEdit[testid] && (
                <IconButton
                  color="primary"
                  onClick={() => onCancel(testid)}
                  data-testid={`description-${testid}-cancel-button`}
                >
                  <Delete fontSize="small" />
                </IconButton>
              )}
            </Fragment>

            {isEdit[testid] ? (
              <ControledInput
                id={testid}
                fullWidth
                multiline
                autoFocus
                value={
                  (Array.isArray(currentContent[testid])
                    ? currentContent[testid].join('\n')
                    : currentContent[testid]) || ''
                }
                onChange={(value) =>
                  setCurrentContent({
                    ...currentContent,
                    [testid]: value ? value.toString() : null
                  })
                }
              />
            ) : (
              (Array.isArray(currentContent[testid])
                ? currentContent[testid]
                : [currentContent[testid]]
              ).map((line, lineIndex) => (
                <Typography
                  key={`${testid}-line-${lineIndex}`}
                  variant={currentContent[testid] ? 'body1' : 'body2'}
                  sx={{ color: !currentContent[testid] ? 'text.secondary' : '' }}
                >
                  {line ?? 'Not specified'}
                </Typography>
              ))
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
