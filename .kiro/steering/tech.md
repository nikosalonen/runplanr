# Technology Stack & Development

## Core Technologies

- **Frontend Framework**: Vue 3 with Composition API and TypeScript
- **Build Tool**: Vite with vue-ts template
- **State Management**: Pinia for global state, Vue 3 reactive state for components
- **Styling**: TailwindCSS with DaisyUI component library
- **Testing**: Vitest for unit testing with comprehensive test coverage
- **Type Safety**: Full TypeScript implementation throughout

## Node.js Requirements

- **Node Version**: ^20.19.0 || >=22.12.0
- **Package Manager**: npm (package-lock.json present)

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting with auto-fix
npm run lint
```

### Testing
```bash
# Run all tests
npm run test:unit

# Run specific test file
npm run test:unit -- --run path/to/test.spec.ts

# Run tests in watch mode (default)
npm run test:unit

# Example: Run specific composable tests
npm run test:unit -- --run src/composables/__tests__/useProgressionRules.spec.ts
```

## Key Dependencies

### Production
- **vue**: ^3.5.18 - Core framework
- **pinia**: ^3.0.3 - State management
- **vue-router**: ^4.5.1 - Client-side routing

### Development
- **@vitejs/plugin-vue**: Vue plugin for Vite
- **tailwindcss**: ^4.1.13 - Utility-first CSS
- **daisyui**: ^5.1.12 - Component library for Tailwind
- **vitest**: ^3.2.4 - Testing framework
- **vue-tsc**: ^3.0.4 - TypeScript compiler for Vue

## Build Configuration

- **Vite Config**: Standard Vue 3 setup with path aliases (`@` -> `src/`)
- **TypeScript**: Multiple tsconfig files for different contexts (app, node, vitest)
- **PostCSS**: Configured for TailwindCSS processing
- **ESLint**: Vue 3 + TypeScript configuration with auto-fix

## Architecture Patterns

- **Composables**: Business logic encapsulated in reusable composables
- **Type-First**: Comprehensive TypeScript interfaces for all data structures
- **Test-Driven**: Extensive test coverage for training science algorithms
- **Metric System**: All calculations and displays use kilometers/minutes per kilometer
