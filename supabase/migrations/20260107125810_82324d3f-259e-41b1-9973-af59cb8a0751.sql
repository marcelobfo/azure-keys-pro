-- Normalize existing slugs to be URL-friendly (remove accents, replace underscores with hyphens)
UPDATE public.tenants 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRANSLATE(slug, 'áàâãäåæçéèêëíìîïñóòôõöøúùûüýÿ', 'aaaaaaeceeeeiiiinooooooouuuuyy'),
      '_', '-'
    ),
    '[^a-z0-9-]', '', 'g'
  )
)
WHERE slug ~ '[^a-z0-9-]' OR slug LIKE '%\_%';