# D&D 5e Next Gen

A modern web application for creating and managing D&D 5e characters, built with React, TypeScript, and Firebase.

## Features

### Character Creation & Management

- **Interactive Character Creation**: Step-by-step wizard for creating D&D 5e characters
  - Race & Subrace selection with trait previews
  - Class & Subclass selection with feature details
  - Background selection with personality traits, ideals, bonds, and flaws
  - Character customization (name, age, gender, appearance, personality)
- **Ability Score Generation**: Multiple methods including point buy, standard array, and custom scores
  - Real-time modifier calculations
  - Racial ability bonuses automatically applied
- **Automatic Equipment & Starting Gear**: Equipment selection based on class choices
- **Character Sheet**: Complete multi-page digital character sheet
  - **Characteristics & Abilities**: Stats, proficiencies, skills, saving throws
  - **Traits & Features**: Racial traits, class features, and special abilities
  - **Equipment & Inventory**: Full equipment management with item details
  - **Character Description**: Personality, appearance, and background information
  - **Spells** (for spellcasters): Complete spell management

### Equipment & Economy

- **Equipment Market**: Buy and sell equipment with D&D 5e pricing rules
  - Search and filter by category
  - Quantity management for stackable items
  - Automatic price calculation (items sell at half price)
  - Free mode for equipment management without gold restrictions
- **Money Management**: Track character wealth across all currency types (GP, SP, CP)
  - Add/remove currency with validation
  - Automatic currency conversion
- **Custom Pricing**: Set custom prices for items without standard costs (magic items, trade goods)

### Spell Management (Spellcasters)

- **Complete Spellbook**: View all available spells for your class
- **Spell Learning**: Select known spells based on class and level
- **Spell Preparation**: Prepare spells for classes that require it
- **Spell Slots**: Automatic spell slot calculation based on level
- **Detailed Spell Information**: Components, casting time, range, damage, and full descriptions
- **How-to Guide**: In-app explanation of spell mechanics

### Character Notes

- **Personal Notes**: Create, edit, and manage notes for each character
- **Note Organization**: Keep track of campaign events, NPCs, and character thoughts

### Additional Features

- **Character Generator**: AI-powered character portrait generator (admin only)
  - Batch generation for multiple characters
  - Download and upload to Firebase Storage
  - Customizable race, class, and gender options
- **Multiple Versions**: Support for different D&D editions (Legacy, 2024 when available)
- **Responsive Design**: Full mobile and desktop support with touch gestures
- **Contact Form**: In-app feedback, bug reports, and feature requests
- **Settings**: Configure D&D version and user preferences

### Data Management

- **Firebase Integration**: Real-time data synchronization and user authentication
- **Database Editor**: Admin tools for managing game data (admin only)
- **Data Import/Export**: Firestore backup and restore capabilities

## Tech Stack

- **Frontend**: React 19, TypeScript, Material-UI
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **Build Tool**: Vite
- **Testing**: Vitest, Cypress
- **Deployment**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js v20 (see [.nvmrc](.nvmrc))
- Yarn package manager
- Firebase project setup
- Service account key for admin features

### Installation

1. Clone the repository:

```bash
git clone https://github.com/AlisonProuteau/dnd5-nextgen.git
cd dnd5-nextgen
```

2. Install dependencies:

```bash
yarn install
```

3. Set up environment variables:
   Create a `.env.local` file with your Firebase configuration:

```env
FIREBASE_CONFIG={"apiKey":"...","authDomain":"...","projectId":"..." ...}
```

4. Set up Firebase service account (for admin features):

```bash
# Place your serviceAccount.json in the root directory
```

### Code Style

- ESLint and Prettier are configured for consistent code formatting
- Run `yarn lint` to check code style
- TypeScript strict mode is enabled

## Project Structure

```
src/
├── api/                    # API layer for external services
├── assets/                 # Static assets (SVGs, images)
├── components/            # React components
│   ├── CharacterCard/     # Character sheet components
│   ├── CharacterCreation/ # Character creation wizard
│   ├── CharacterGenerator/ # AI portrait generator
│   └── shared/           # Reusable UI components
├── providers/            # React context providers
├── representations/      # TypeScript type definitions
├── tests/               # Test utilities and mocks
└── utils/               # Utility functions
└── hooks/               # Custom hooks
```

## Key Components

### Character Creation Flow

1. **Race Selection** ([`CharacterRaceForm`](src/components/CharacterCreation/CharacterRaceForm.tsx))
2. **Class Selection** ([`CharacterClassForm`](src/components/CharacterCreation/CharacterClassForm.tsx))
3. **Background** ([`CharacterBackgroundForm`](src/components/CharacterCreation/CharacterBackgroundForm.tsx))
4. **Character Details** ([`CharacterDescription`](src/components/CharacterCreation/CharacterDescription.tsx))

### Character Management

- **Character Sheet** ([`CharacterContainer`](src/components/CharacterCard/CharacterContainer.tsx))
- **Ability Scores** ([`CharacterPoints`](src/components/CharacterCard/CharacterPoints.tsx))
- **Equipment & Market** ([`EquipmentsStep`](src/components/CharacterCard/Equipment/EquipmentsStep.tsx), [`Market`](src/components/CharacterCard/Equipment/Market.tsx))
- **Money Management** ([`MoneyManager`](src/components/CharacterCard/Equipment/MoneyManager.tsx))
- **Spells** ([`SpellsStep`](src/components/CharacterCard/Spells/SpellsStep.tsx))
- **Character Notes** ([`CharacterNotes`](src/components/CharacterCard/CharacterNotes.tsx))

### Admin Features

- **Character Generator** ([`CharacterGenerator`](src/components/CharacterGenerator/CharacterGenerator.tsx))
- **Database Editor** ([`DataBasePage`](src/providers/DataBasePage.tsx))

## Data Sources

This application uses the [D&D 5e API](https://5e-bits.github.io/docs/api) for game data and maintains its own Firebase database for user characters and enhanced features.

## Deployment

The application is automatically deployed to Firebase Hosting via GitHub Actions.

### Manual Deployment

```bash
yarn build
firebase deploy
```

## Database Management

### Import Firestore Data

```bash
./import_firestore.sh --latest
```

### Backup and Restore

The application includes scripts for backing up and restoring Firestore data. See [`import_firestore.sh`](import_firestore.sh) for details.

## Available Scripts

### Development

- `yarn start` - Start development server with Vite
- `yarn build` - Build for production (TypeScript compilation + Vite build)
- `yarn format` - Format code with Prettier

### Testing

- `yarn test` - Run unit tests with Vitest
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn cy` - Open Cypress test runner with emulators (interactive)
- `yarn cy:local` - Run Cypress tests in headless mode

### Firebase & Database

- `yarn firebase:emulate` - Start Firebase emulators (Auth, Firestore, Storage)
- `yarn firestore:import` - Import Firestore data from backup
- `yarn start:dist` - Build and serve with Firebase emulators

### Test Reports

- `yarn merge:reports` - Merge Cypress test reports into single JSON
- `yarn generate:reports` - Generate HTML and text reports from merged results

## License

MIT License - see [package.json](package.json) for details.

## Roadmap

### Current TODO List

#### Features

- [ ] Add status effect (+ select to clear on rest?)
- [ ] Add "Action Record" that can track spells/feature/traits used + rests + maybe health or money + custom?
- [ ] Handle Level class_specific and race_specific data?
- [ ] Spell enhancements (Manually add more cantrips/slots)?
- [ ] Class archetype support?

#### Dev

- [ ] Add the subclass feature improvements https://github.com/5e-bits/5e-database/pull/836
- [ ] Improve ticket system
- [ ] Update Qodo Merge config
- [ ] Complete code styling refactor
- [ ] D&D 2024 edition support

## Support

For bug reports and feature requests, use the in-app contact form or create an issue in the repository.

## Links

- [D&D 5e API Documentation](https://5e-bits.github.io/docs/api)
- [Project Management](https://kanbanflow.com/board/2FkZc7Y)
- [D&D Basic Rules](https://www.dndbeyond.com/sources/basic-rules)
