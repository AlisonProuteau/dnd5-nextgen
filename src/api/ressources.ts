import { get, getAll, type QueryObject } from '@utils/api.utils';
import type { Version } from '@utils/constants/versions.constants';
import type { Feature } from '@representations/abilities/feature.representation';
import type {
  MagicItem,
  Spell,
  SpellFilters
} from '@representations/abilities/magic.representation';
import type { Trait } from '@representations/abilities/trait.representation';
import type { AbilityScore, Proficiency } from '@representations/campaign/adventure.representation';
import type {
  Equipment,
  EquipmentCategory,
  WeaponProperty
} from '@representations/campaign/equipment.representation';
import type { Level } from '@representations/campaign/level.representation';
import type { Alignment, Background } from '@representations/character/background.representation';
import type { Classes, Subclass } from '@representations/character/class.representation';
import type { Race, Subrace } from '@representations/character/race.representation';
import type { DefaultRepresentation, Option } from '@representations/common.representation';
import type { ClassGuide, RaceGuide } from '@representations/guide.representation';

const formatPath = (path: string, version?: Version) => {
  const pathFormatted = path.startsWith('/') ? path.replace('/', '') : path;
  return version ? `versions/${version.toLowerCase()}/${pathFormatted}` : pathFormatted;
};

export async function getAllRaces(version: Version): Promise<{
  count: number;
  results: (DefaultRepresentation & { img?: string })[];
}> {
  return get('All Races', formatPath('races', version), 'all');
}

export async function getAllSubraces(
  version: Version,
  raceIndex: string
): Promise<{
  count: number;
  results: Subrace[];
}> {
  return getAll('All Subraces', formatPath(`races/${raceIndex}/subraces`, version));
}

export async function getRaceInfo(version: Version, raceIndex: string): Promise<Race | null> {
  return get('Race info', formatPath('races', version), raceIndex);
}

export async function getSubraceInfo(
  version: Version,
  raceIndex: string,
  subraceIndex: string
): Promise<Subrace | null> {
  return get('Subace info', formatPath(`races/${raceIndex}/subraces`, version), subraceIndex);
}

export async function getAllClasses(version: Version): Promise<{
  count: number;
  results: (DefaultRepresentation & { img?: string })[];
}> {
  return get('All Classes', formatPath('classes', version), 'all');
}

export async function getAllSubclasses(
  version: Version,
  classIndex: string
): Promise<{
  count: number;
  results: Subclass[];
}> {
  return getAll('All Subclasses', formatPath(`classes/${classIndex}/subclasses`, version));
}

export async function getClassInfo(
  version: Version,
  classIndex: string,
  level?: number
): Promise<Classes | Level | null> {
  return level
    ? get(
        'Class Level Ressources',
        formatPath(`classes/${classIndex}/levels`, version),
        `${classIndex}-${level}`
      )
    : get('Class Ressources', formatPath('classes', version), classIndex);
}

export async function getSubclassInfo(
  version: Version,
  classIndex: string,
  subclassIndex: string,
  level?: number
): Promise<Subclass | Level | null> {
  return level
    ? get(
        `Subclass Level Ressources`,
        formatPath(`classes/${classIndex}/subclasses/${subclassIndex}/levels`, version),
        `${subclassIndex}-${level}`
      )
    : get(
        `Subclass Ressources`,
        formatPath(`classes/${classIndex}/subclasses`, version),
        subclassIndex
      );
}

export async function getClassGuide(
  version: Version,
  classIndex: string
): Promise<ClassGuide | null> {
  return get(
    `Class Guide`,
    formatPath(`classes/${classIndex}/guides`, version),
    `${classIndex}-guide-v1`
  );
}

export async function getRaceGuide(version: Version, raceIndex: string): Promise<RaceGuide | null> {
  return get(
    `Race Guide`,
    formatPath(`races/${raceIndex}/guides`, version),
    `${raceIndex}-guide-v1`
  );
}

export function getAllAligmenents(
  version: Version
): Promise<{ count: number; results: Alignment[] }> {
  return getAll('Alignments', formatPath('alignments', version));
}

export function getAllBackgrounds(
  version: Version
): Promise<{ count: number; results: Background[] }> {
  return getAll('Backgrounds', formatPath('backgrounds', version));
}

function getQueryForIndexAndLevel(
  index: string,
  level?: number,
  subclass: boolean = false
): QueryObject[] {
  const levelQuery: QueryObject[] = level
    ? [
        {
          fieldPath: 'level',
          opStr: '<=',
          value: level
        }
      ]
    : [];

  return [
    ...levelQuery,
    {
      fieldPath: subclass ? 'subclasses' : 'classes',
      opStr: 'array-contains',
      value: index
    }
  ];
}

export async function getSpellsForClass(
  version: Version,
  classIndex: string,
  subclassIndex?: string,
  level?: number
): Promise<{ count: number; results: Spell[] }> {
  const subClassSpells: Spell[] = subclassIndex
    ? (
        await getAll(
          'Spells for subclass',
          formatPath('spells', version),
          getQueryForIndexAndLevel(subclassIndex, level, true)
        )
      ).results
    : [];

  const allSpells = (
    (
      await getAll(
        'Spells for class',
        formatPath('spells', version),
        getQueryForIndexAndLevel(classIndex, level)
      )
    ).results as Spell[]
  )
    .concat(subClassSpells)
    .reduce((acc: Spell[], current) => {
      if (acc.find((spell) => spell.index === current.index && spell.level === current.level))
        return acc;

      return [...acc, current];
    }, []);

  return { count: allSpells.length, results: allSpells };
}

export async function getMagicSchools(
  version: Version
): Promise<{ count: number; results: { index: string; name: string }[] }> {
  return getAll('Magic Schools', formatPath('magic-schools', version));
}

export async function getMatchingSpells(
  version: Version,
  filters?: SpellFilters
): Promise<{ count: number; results: Spell[] }> {
  const queries: QueryObject[] = [
    { fieldPath: 'level', opStr: '>=', value: filters?.minLevel ?? 0 }
  ];

  if (filters?.maxLevel !== undefined)
    queries.push({ fieldPath: 'level', opStr: '<=', value: filters.maxLevel });

  if (filters?.school)
    queries.push({ fieldPath: 'school.index', opStr: '==', value: filters.school });

  if (filters?.ritual !== undefined)
    queries.push({ fieldPath: 'ritual', opStr: '==', value: filters.ritual });

  if (filters?.concentration !== undefined)
    queries.push({ fieldPath: 'concentration', opStr: '==', value: filters.concentration });

  if (filters?.classFilter && filters?.subclassFilter)
    queries.push({
      fieldPath: 'subclasses',
      opStr: 'array-contains',
      value: filters.subclassFilter
    });
  else if (filters?.classFilter)
    queries.push({ fieldPath: 'classes', opStr: 'array-contains', value: filters.classFilter });

  if (filters?.racial !== undefined)
    queries.push({ fieldPath: 'racial', opStr: '==', value: filters.racial });

  const spells = (
    (await getAll('Spells', formatPath('spells', version), queries)).results as Spell[]
  ).filter(({ classes }) =>
    filters?.classFilter && filters?.subclassFilter ? classes.includes(filters.classFilter) : true
  );
  return { count: spells.length, results: spells };
}

export async function getSpell(version: Version, index: string): Promise<Spell | null> {
  return get('Spell', formatPath('spells', version), index);
}

export async function getFeature(version: Version, index: string): Promise<Feature | null> {
  return get('Feature', formatPath('features', version), index);
}

export async function getTrait(version: Version, index: string): Promise<Trait | null> {
  return get('Trait', formatPath('traits', version), index);
}

export async function getAllTraitsAndFeatures(
  version: Version
): Promise<Trait[] | Feature[] | null> {
  const traits = await getAll('Traits', formatPath('traits', version));
  const features = await getAll('Features', formatPath('features', version));

  return traits.results.concat(features.results);
}

export async function getProficiencies(version: Version): Promise<{
  count: number;
  results: Proficiency[];
}> {
  return getAll('Proficiencies', formatPath('proficiencies', version));
}

export async function getResourceList(
  version: Version,
  path: string
): Promise<{
  count: number;
  results: Option[];
}> {
  const pathArray = (path.startsWith('/') ? path.replace('/', '') : path).split('/');
  let data = { count: 0, results: [] as DefaultRepresentation[] };

  if (!(pathArray.length % 2)) {
    const index = pathArray.pop() || '';
    const equipment = await getAll(
      `Resource list ${path}`,
      formatPath(pathArray.join('/'), version),
      [
        {
          fieldPath: 'equipment_category.index',
          opStr: '==',
          value: index
        },
        {
          fieldPath: 'armor_category.index',
          opStr: '==',
          value: index
        },
        {
          fieldPath: 'gear_category.index',
          opStr: '==',
          value: index
        },
        {
          fieldPath: 'tool_category.index',
          opStr: '==',
          value: index
        },
        {
          fieldPath: 'vehicle_category.index',
          opStr: '==',
          value: index
        },
        {
          fieldPath: 'weapon_category.index',
          opStr: '==',
          value: index
        },
        {
          fieldPath: 'category_range.index',
          opStr: '==',
          value: index
        }
      ],
      true
    );
    data = equipment;
  } else {
    data = await getAll(`Resource list ${path}`, formatPath(path, version));
  }

  return {
    count: data.count,
    results: data.results.map(({ index, name }) => ({
      option_type: 'reference',
      item: { index, name }
    }))
  };
}

export async function getEquipment(version: Version, index: string): Promise<Equipment | null> {
  return get('Equipment', formatPath('equipment', version), index);
}

export async function getMagicItem(version: Version, index: string): Promise<MagicItem | null> {
  return get('Magic Item', formatPath('magic-items', version), index);
}

export async function getAllEquipment(
  version: Version,
  equipmentCategoryIndex?: string,
  equipmentSubCategoryIndex?: string
): Promise<{ count: number; results: Equipment[] }> {
  const selector: QueryObject[] = [];

  if (equipmentCategoryIndex) {
    selector.push({
      fieldPath: 'equipment_category.index',
      opStr: '==',
      value: equipmentCategoryIndex
    });
  }

  if (equipmentSubCategoryIndex) {
    let equipmentSubCategoryKey = '';
    switch (equipmentCategoryIndex) {
      case 'armor':
        equipmentSubCategoryKey = 'armor_category.index';
        break;
      case 'weapon':
        equipmentSubCategoryKey = equipmentSubCategoryIndex.match(/^.+-.+-.+$/)?.length
          ? 'category_range.index'
          : `weapon_${equipmentSubCategoryIndex.includes('melee') || equipmentSubCategoryIndex.includes('ranged') ? 'range' : 'category'}.index`;
        break;
      case 'tools':
        equipmentSubCategoryKey = 'tool_category.index';
        break;
      case 'mounts-and-vehicles':
        equipmentSubCategoryKey = 'vehicle_category.index';
        break;
      case 'adventuring-gear':
        equipmentSubCategoryKey = 'gear_category.index';
        break;
      default:
        console.error(
          'getAllEquipment: Unknown equipment category for sub-category filtering:',
          equipmentCategoryIndex
        );
        equipmentSubCategoryKey = 'equipment_category.index';
    }
    selector.push({
      fieldPath: equipmentSubCategoryKey,
      opStr: '==',
      value: equipmentSubCategoryIndex
    });
  }
  return getAll('Equipment', formatPath('equipment', version), selector, false, 'name');
}

export async function getAllMagicItems(
  version: Version,
  equipmentCategoryIndex?: string
): Promise<{ count: number; results: MagicItem[] }> {
  const selector: QueryObject[] = [];

  if (equipmentCategoryIndex) {
    selector.push({
      fieldPath: 'equipment_category.index',
      opStr: '==',
      value: equipmentCategoryIndex
    });
  }

  return getAll('Magic Items', formatPath('magic-items', version), selector, false, 'name');
}

export async function getEquipmentCategories(
  version: Version
): Promise<{ count: number; results: EquipmentCategory[] }> {
  return getAll('Equipment Categories', formatPath('equipment-categories', version));
}

export async function getProperty(version: Version, index: string): Promise<WeaponProperty | null> {
  return get('Property', formatPath('weapon-properties', version), index);
}

export async function getAllAbilities(version: Version): Promise<{
  count: number;
  results: AbilityScore[];
}> {
  return getAll('All Abilities', formatPath('ability-scores', version));
}
