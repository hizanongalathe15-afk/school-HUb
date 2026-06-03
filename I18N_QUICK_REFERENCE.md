# 🌐 Quick i18n Reference for Developers

## TL;DR - Quick Start

### Use Translation Hook
```tsx
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('buttons.save')}</h1>;
}
```

### Supported Languages
- 🇬🇧 English (en)
- 🇹🇿 Swahili (sw)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇮🇹 Italian (it)
- 🇸🇦 Arabic (ar) - RTL

### Add Language Switcher
```tsx
import LanguageSwitcher from '@/i18n/LanguageSwitcher';

<LanguageSwitcher variant="dropdown" />
```

## Translation Key Patterns

```
// Format: namespace.feature.key
'common.login'           // UI text
'buttons.save'           // Button labels
'status.active'          // Status values
'public.admissions.*'    // Page-specific content
'dashboard.analytics'    // Dashboard content
'errors.invalidEmail'    // Error messages
```

## Common Keys Reference

| Key | English | Usage |
|-----|---------|-------|
| `buttons.save` | Save | Form submission |
| `buttons.cancel` | Cancel | Modal close |
| `buttons.delete` | Delete | Destructive actions |
| `auth.login` | Log in | Login page |
| `common.select_language` | Select a language | Language picker |
| `public.loading` | Loading... | Loading states |
| `public.pageNotFound` | Page Not Found | 404 page |

## Using with Variables

```tsx
const { t } = useTranslation();

// Simple variable substitution
const message = t('admissions.emailSubject', { schoolName: 'My School' });
// Result: "Admissions inquiry for My School"

// Return objects/arrays
const steps = t('public.admissionsSteps', { returnObjects: true });
steps.forEach(step => console.log(step.title));
```

## Adding New Translations

1. Add to `en/common.json`:
```json
{
  "myFeature": {
    "label": "My Feature"
  }
}
```

2. Add to `sw/common.json`, `fr/common.json`, etc.

3. Use in component:
```tsx
{t('myFeature.label')}
```

## RTL Detection

```tsx
import { isRTL } from '@/i18n/settings';

if (isRTL('ar')) {
  // Apply RTL styles
}
```

## Locale Files Structure

```
locales/
├── en/
│   ├── common.json       ← Add general UI text here
│   ├── navigation.json
│   ├── parent.json
│   └── dashboard.json
├── sw/ ├── fr/ ├── de/ ├── it/ └── ar/
    (same structure for each language)
```

## Common Mistakes to Avoid

❌ Hardcoding UI text:
```tsx
<button>Save</button>  // Wrong!
```

✅ Always use translation:
```tsx
<button>{t('buttons.save')}</button>  // Correct!
```

❌ Forgetting to add translation key to all languages:
```tsx
// en/common.json ✅
// sw/common.json ❌ Missing!
```

✅ Add to all 6 languages:
```tsx
// en/common.json ✅
// sw/common.json ✅
// fr/common.json ✅
// de/common.json ✅
// it/common.json ✅
// ar/common.json ✅
```

## Public Pages (Already Using i18n)

These pages automatically support all 6 languages:
- ✅ Home, About, Academics
- ✅ Admissions, Contact, Events
- ✅ Gallery, Downloads, Life

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Text not translating | Check translation key exists in all 6 locale files |
| RTL layout broken | Ensure `document.documentElement.dir="rtl"` for Arabic |
| Language doesn't persist | Check localStorage isn't disabled |
| Missing translation | Check for typos in key name |

## Performance Tips

✅ Use namespaces to load only needed translations
✅ Lazy load locale files in production
✅ Cache translations in memory
✅ Use `returnObjects: true` for complex data structures

---

**Questions?** Check `I18N_IMPLEMENTATION_GUIDE.md` for detailed documentation.
