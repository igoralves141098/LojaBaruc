import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCE_DIR = path.join(ROOT, 'Produtos')
const CONFIG_PATH = path.join(ROOT, 'scripts', 'catalog.config.json')
const PUBLIC_IMAGES_DIR = path.join(ROOT, 'public', 'produtos')
const OUTPUT_PATH = path.join(ROOT, 'public', 'api', 'products.json')
const PUBLIC_IMAGES_URL = 'produtos'

const OFFICIAL_SIZES = ['P', 'M', 'G', 'GG']
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const INFO_FILE_NAME = 'info.txt'

const OFFICIAL_PRICES = [
  { match: 'camisas polo ziper metalico', price: 134.99 },
  { match: 'camisas polo ziper', price: 109.99 },
  { match: 'camisas polo', price: 94.99 },
  { match: 'camisa basica texturizada', price: 89.99 },
  { match: 'camisas basica algodao', price: 79.99 },
  { match: 'camisas gola v', price: 89.99 },
  { match: 'camisas linho social', price: 134.99 },
  { match: 'camisas regata', price: 69.99 },
  { match: 'camisas texturizada brisa', price: 118.99 },
  { match: 'jaqueta', price: 299.99 },
  { match: 'short flex', price: 69.99 },
  { match: 'short linho', price: 79.99 },
  { match: 'short sarja', price: 79.99 },
  { match: 'sueter', price: 109.99 },
]

const log = (message) => console.log(`[sync-products] ${message}`)
const warn = (message) => console.warn(`[sync-products] AVISO: ${message}`)

const stripAccents = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const slugify = (value) =>
  stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const naturalCompare = (a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' })

const normalizeMatch = (value) => stripAccents(value).toLowerCase().replace(/\s+/g, ' ').trim()

const getOfficialPrice = (folderName) => {
  const normalized = normalizeMatch(folderName)
  const entry = OFFICIAL_PRICES.find(({ match }) => normalized.includes(match))
  return entry ? entry.price : null
}

const buildInfoContent = (folderName, price) =>
  `NOME: ${folderName}\nPRECO: ${price.toFixed(2).replace('.', ',')}\n`

const singularize = (folderName) => folderName.replace(/^Camisas\b/i, 'Camisa')

const inferNiche = (folderName) => {
  const slug = slugify(folderName)
  if (slug.includes('camisa') || slug.includes('polo') || slug.includes('regata') || slug.includes('gola')) {
    return 'Camisas'
  }
  if (slug.includes('short') || slug.includes('bermuda')) return 'Shorts'
  if (slug.includes('sueter')) return 'Suéter'
  if (slug.includes('jaqueta') || slug.includes('casaco')) return 'Jaqueta'
  return 'Camisas'
}

const buildSkuPrefix = (folderName) =>
  stripAccents(folderName)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .join('')
    .slice(0, 5)

const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0

const toStringList = (value) =>
  Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()) : []

const createGroupDefaults = (folderName) => {
  const name = singularize(folderName)
  return {
    name,
    niche: inferNiche(folderName),
    description: `${name} BARUC com acabamento premium e caimento masculino. Disponível do P ao GG.`,
    price: getOfficialPrice(folderName),
    originalPrice: null,
    colors: [],
    sizes: [...OFFICIAL_SIZES],
    inStock: true,
    badge: null,
  }
}

const readConfig = async () => {
  if (!existsSync(CONFIG_PATH)) return { groups: {} }
  const raw = await readFile(CONFIG_PATH, 'utf8')
  const parsed = JSON.parse(raw)
  return { ...parsed, groups: parsed.groups ?? {} }
}

const listFolders = async () => {
  const entries = await readdir(SOURCE_DIR, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name.normalize('NFC'))
    .sort(naturalCompare)
}

const listImages = async (folderPath) => {
  const entries = await readdir(folderPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort(naturalCompare)
}

const syncFile = async (source, destination) => {
  const sourceStat = await stat(source)
  if (existsSync(destination)) {
    const destinationStat = await stat(destination)
    if (destinationStat.size === sourceStat.size && destinationStat.mtimeMs >= sourceStat.mtimeMs) return false
  }
  await copyFile(source, destination)
  return true
}

const removeStaleFiles = async (directory, keep) => {
  if (!existsSync(directory)) return 0
  let removed = 0
  const entries = await readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      removed += await removeStaleFiles(entryPath, keep)
    } else if (!keep.has(entryPath)) {
      await unlink(entryPath)
      removed += 1
    }
  }
  return removed
}

const main = async () => {
  if (!existsSync(SOURCE_DIR)) {
    warn(`pasta ${SOURCE_DIR} não encontrada. Mantendo ${path.relative(ROOT, OUTPUT_PATH)} atual.`)
    return
  }

  const config = await readConfig()
  const folders = await listFolders()
  const folderSet = new Set(folders)
  const groups = {}
  let configChanged = false

  for (const [folderName, groupConfig] of Object.entries(config.groups)) {
    if (folderSet.has(folderName)) {
      groups[folderName] = { ...createGroupDefaults(folderName), ...groupConfig }
    } else {
      warn(`"${folderName}" está no catalog.config.json mas não existe em ./Produtos (ignorado).`)
      groups[folderName] = groupConfig
    }
  }

  for (const folderName of folders) {
    if (!(folderName in config.groups)) {
      groups[folderName] = createGroupDefaults(folderName)
      configChanged = true
      log(`nova pasta detectada: "${folderName}" (adicionada ao catalog.config.json)`)
    }
  }

  for (const folderName of folders) {
    const officialPrice = getOfficialPrice(folderName)
    if (officialPrice === null) {
      warn(`sem preço oficial definido para "${folderName}".`)
      continue
    }

    const group = groups[folderName] ?? createGroupDefaults(folderName)
    if (group.price !== officialPrice) configChanged = true
    groups[folderName] = { ...group, price: officialPrice }

    await writeFile(
      path.join(SOURCE_DIR, folderName, INFO_FILE_NAME),
      buildInfoContent(folderName, officialPrice),
      'utf8',
    )
  }

  const orderedFolders = Object.keys(groups).filter((folderName) => folderSet.has(folderName))
  const products = []
  const keepFiles = new Set()
  const usedPrefixes = new Set()
  let copied = 0

  for (const folderName of orderedFolders) {
    const group = groups[folderName]
    const slug = slugify(folderName)
    const images = await listImages(path.join(SOURCE_DIR, folderName))

    if (images.length === 0) {
      warn(`"${folderName}" não possui imagens (ignorado).`)
      continue
    }

    let skuPrefix = typeof group.skuPrefix === 'string' && group.skuPrefix ? group.skuPrefix : buildSkuPrefix(folderName)
    let suffix = 2
    const basePrefix = skuPrefix
    while (usedPrefixes.has(skuPrefix)) skuPrefix = `${basePrefix}${suffix++}`
    usedPrefixes.add(skuPrefix)

    const destinationDir = path.join(PUBLIC_IMAGES_DIR, slug)
    await mkdir(destinationDir, { recursive: true })

    const groupSizes = toStringList(group.sizes)
    const groupColors = toStringList(group.colors)
    const overrides = group.items && typeof group.items === 'object' ? group.items : {}

    for (const [index, fileName] of images.entries()) {
      const extension = path.extname(fileName).toLowerCase()
      const sequence = String(index + 1).padStart(2, '0')
      const publicFileName = `${slug}-${sequence}${extension}`
      const destination = path.join(destinationDir, publicFileName)

      if (await syncFile(path.join(SOURCE_DIR, folderName, fileName), destination)) copied += 1
      keepFiles.add(destination)

      const item = overrides[fileName] ?? {}
      const itemColors = typeof item.color === 'string' && item.color.trim() ? [item.color.trim()] : toStringList(item.colors)
      const officialPrice = getOfficialPrice(folderName)
      const price = officialPrice ?? (isPositiveNumber(item.price) ? item.price : isPositiveNumber(group.price) ? group.price : null)
      const originalPrice = isPositiveNumber(item.originalPrice)
        ? item.originalPrice
        : isPositiveNumber(group.originalPrice)
          ? group.originalPrice
          : null
      const badge = typeof item.badge === 'string' ? item.badge : typeof group.badge === 'string' ? group.badge : null
      const inStock = typeof item.inStock === 'boolean' ? item.inStock : group.inStock !== false

      const product = {
        id: `${slug}-${sequence}`,
        sku: `BRC-${skuPrefix}-${sequence}`,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `${group.name} ${sequence}`,
        description: typeof item.description === 'string' ? item.description : group.description,
        price,
        imageUrl: `${PUBLIC_IMAGES_URL}/${slug}/${publicFileName}`,
        category: folderName,
        categorySlug: slug,
        niche: typeof group.niche === 'string' && group.niche ? group.niche : inferNiche(folderName),
        sizes: groupSizes.length > 0 ? groupSizes : [...OFFICIAL_SIZES],
        colors: itemColors.length > 0 ? itemColors : groupColors,
        inStock,
      }

      if (price !== null && originalPrice !== null && originalPrice > price) product.originalPrice = originalPrice
      if (badge) product.badge = badge

      products.push(product)
    }
  }

  const removed = await removeStaleFiles(PUBLIC_IMAGES_DIR, keepFiles)

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await writeFile(OUTPUT_PATH, `${JSON.stringify(products, null, 2)}\n`, 'utf8')

  if (configChanged || !existsSync(CONFIG_PATH)) {
    const nextConfig = {
      $comment:
        'Edite nome, nicho, cores e tamanhos por pasta de ./Produtos. Os preços oficiais são aplicados automaticamente pelo script. Use "items" para sobrescrever por arquivo (ex.: { "foto.jpg": { "color": "Preto" } }).',
      ...config,
      groups,
    }
    await writeFile(CONFIG_PATH, `${JSON.stringify(nextConfig, null, 2)}\n`, 'utf8')
  }

  log(
    `${products.length} produtos em ${orderedFolders.length} pastas -> ${path.relative(ROOT, OUTPUT_PATH)} ` +
      `(${copied} imagens copiadas, ${removed} removidas)`,
  )
}

main().catch((error) => {
  console.error('[sync-products] Falha na sincronização:', error)
  process.exit(1)
})
