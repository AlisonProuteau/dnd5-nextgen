# D&D 5e Next Gen

A modern web application for creating and managing D&D 5e characters, built with React, TypeScript, and Firebase.

## Features

### Character Creation & Management

- **Interactive Character Creation**: Step-by-step wizard for creating D&D 5e characters
- **Race & Class Selection**: Choose from all official D&D 5e races, subraces, classes, and subclasses
- **Ability Score Generation**: Multiple methods including point buy, standard array, and custom scores
- **Equipment & Spells**: Automatic equipment assignment and spell management
- **Character Sheet**: Complete digital character sheet with all stats, traits, and abilities

### Advanced Features

- **Character Generator**: AI-powered character portrait generator (admin only)
- **Spell Management**: Complete spellbook with spell slots and preparation tracking
- **Character Notes**: Add and manage personal notes for each character
- **Multiple Versions**: Support for different D&D editions (Legacy, 2024 when available)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Data Management

- **Firebase Integration**: Real-time data synchronization and user authentication
- **Database Editor**: Admin tools for managing game data (admin only)

## Tech Stack

- **Frontend**: React 20, TypeScript, Material-UI
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
git clone <repository-url>
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

### Code Style

- ESLint and Prettier are configured for consistent code formatting
- Run `yarn lint` to check code style
- TypeScript strict mode is enabled

## Available Scripts

- `yarn start` - Start development server
- `yarn build` - Build for production
- `yarn test` - Run unit tests
- `yarn test:watch` - Run tests in watch mode
- `yarn test:coverage` - Run tests with coverage report
- `yarn firestore:import` - Import Firestore data
- `yarn cy:open` - Open Cypress test runner with emulators

## License

MIT License - see [package.json](package.json) for details.

## Roadmap

### Current TODO List

- [ ] Complete code styling refactor
- [ ] Add info page for app navigation and features
- [ ] Spell enhancements (Manually add more cantrips/slots)?
- [ ] Class archetype support?
- [ ] D&D 2024 edition support
- [ ] Character deletion/archiving
- [ ] Notes management improvements (delete/archive)

## Support

For bug reports and feature requests, use the in-app contact form or create an issue in the repository.

## Links

- [D&D 5e API Documentation](https://5e-bits.github.io/docs/api)
- [Project Management](https://kanbanflow.com/board/2FkZc7Y)
- [D&D Basic Rules](https://www.dndbeyond.com/sources/basic-rules)
