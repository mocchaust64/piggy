Add a new cultural gift template to the Gold Piggy Bank app.

Ask the developer:
1. Template key (snake_case, e.g. `giang_sinh`, `dai_hoc`, `tan_nha`)
2. Occasion name in English and Vietnamese
3. Primary color (hex or description)
4. Is there a Lottie animation file ready? (if yes, provide the path)

---

## Existing templates (do not duplicate keys)

| Key | English | Vietnamese |
|-----|---------|-----------|
| `tet` | Lunar New Year | Tết Nguyên Đán |
| `sinhnhat` | Birthday | Sinh Nhật |
| `cuoihoi` | Wedding | Cưới Hỏi |
| `thoinhoi` | First Birthday | Thôi Nôi |

---

## File 1: Update `src/constants/giftTemplates.ts`

Add to `GIFT_TEMPLATES`:

```typescript
'[template_key]': {
  key: '[template_key]',
  i18nKey: 'giftTemplate.[template_key]',
  colorTheme: {
    primary: '#[hex]',
    secondary: '#[hex]',
    text: '#FFFFFF',
    background: '#[hex]',
  },
  lottieFile: null, // TODO: require('@/assets/lottie/gift-[template_key].json')
  emoji: '[emoji]',
  sortOrder: [next number],
},
```

---

## File 2: Add i18n strings

**`src/i18n/locales/en.ts`** — add under `giftTemplate`:
```typescript
[template_key]: {
  name: '[English occasion name]',
  description: '[Short description in English]',
  defaultMessage: '[Warm English greeting message]',
},
```

**`src/i18n/locales/vi.ts`** — add under `giftTemplate`:
```typescript
[template_key]: {
  name: '[Tên dịp lễ tiếng Việt]',
  description: '[Mô tả ngắn]',
  defaultMessage: '[Lời chúc tiếng Việt phù hợp văn hóa]',
},
```

Also update the `TranslationKeys` type in `en.ts` to include the new key.

---

## File 3: Update `src/components/gift/GiftAnimation.tsx`

```typescript
case '[template_key]':
  return require('@/assets/lottie/gift-[template_key].json')
// Falls back to default animation until Lottie file is added
```

---

## File 4: Database (only if template_type is a CHECK constraint)

If the `gifts.template_type` column uses a CHECK constraint (current schema does), add a migration:

```sql
-- Drop and recreate the constraint to include the new value
ALTER TABLE gifts DROP CONSTRAINT IF EXISTS gifts_template_type_check;
ALTER TABLE gifts ADD CONSTRAINT gifts_template_type_check
  CHECK (template_type IN ('tet', 'sinhnhat', 'cuoihoi', 'thoinhoi', '[template_key]'));
```

Also update `GiftTemplateType` in `src/types/database.ts`.

---

## File 5: Update analytics

Add to `GiftTemplateKey` type in `src/lib/analytics.ts`:
```typescript
export type GiftTemplateKey = 'tet' | 'sinhnhat' | 'cuoihoi' | 'thoinhoi' | '[template_key]'
```

---

## Vietnamese cultural messaging guide

| Occasion | Vietnamese greeting style |
|----------|--------------------------|
| Tết | Chúc mừng năm mới + May mắn, bình an |
| Birthday | Sức khỏe, học giỏi, hạnh phúc |
| Wedding | Hạnh phúc, thịnh vượng |
| First birthday | Hay ăn chóng lớn, vui vẻ |
| Christmas | Noel vui vẻ, an lành |
| Graduation | Thành công, tươi sáng |
