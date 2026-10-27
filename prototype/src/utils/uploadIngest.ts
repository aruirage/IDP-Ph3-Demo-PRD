import JSZip from 'jszip'

export interface IngestInput {
  file: File
  relativePath: string
}

type FileSystemEntry = globalThis.FileSystemEntry
type FileSystemFileEntry = globalThis.FileSystemFileEntry
type FileSystemDirectoryEntry = globalThis.FileSystemDirectoryEntry
type FileSystemDirectoryReader = globalThis.FileSystemDirectoryReader

function readAllDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = []

    const readBatch = () => {
      reader.readEntries((batch) => {
        if (!batch.length) {
          resolve(entries)
          return
        }
        entries.push(...batch)
        readBatch()
      }, reject)
    }

    readBatch()
  })
}

async function readFileEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject)
  })
}

async function readEntry(entry: FileSystemEntry, parentDirPath = ''): Promise<IngestInput[]> {
  if (entry.isFile) {
    const file = await readFileEntry(entry as FileSystemFileEntry)
    const relativePath = parentDirPath ? `${parentDirPath}/${file.name}` : file.name
    return [{ file, relativePath }]
  }

  if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const currentDirPath = parentDirPath ? `${parentDirPath}/${entry.name}` : entry.name
    const children = await readAllDirectoryEntries(dirEntry.createReader())
    const results: IngestInput[] = []

    for (const child of children) {
      if (child.isFile) {
        const file = await readFileEntry(child as FileSystemFileEntry)
        results.push({
          file,
          relativePath: `${currentDirPath}/${file.name}`
        })
      } else {
        results.push(...(await readEntry(child, currentDirPath)))
      }
    }

    return results
  }

  return []
}

function isZipFile(file: File) {
  return file.name.toLowerCase().endsWith('.zip')
}

export async function extractZipFile(zipFile: File): Promise<IngestInput[]> {
  const zip = await JSZip.loadAsync(zipFile)
  const results: IngestInput[] = []

  for (const [path, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue

    const normalized = path.replace(/\\/g, '/').replace(/^\/+/, '')
    if (!normalized) continue

    const blob = await entry.async('blob')
    const fileName = normalized.split('/').pop() || normalized
    const file = new File([blob], fileName, { type: blob.type || 'application/octet-stream' })

    results.push({ file, relativePath: normalized })
  }

  return results
}

export async function collectFromDataTransfer(dataTransfer: DataTransfer): Promise<IngestInput[]> {
  const items = Array.from(dataTransfer.items)
  const results: IngestInput[] = []

  if (items.length > 0 && items.some((item) => typeof item.webkitGetAsEntry === 'function')) {
    for (const item of items) {
      if (item.kind !== 'file') continue

      const entry = item.webkitGetAsEntry()
      if (entry) {
        if (entry.isFile && entry.name.toLowerCase().endsWith('.zip')) {
          const file = await readFileEntry(entry as FileSystemFileEntry)
          results.push(...(await extractZipFile(file)))
          continue
        }

        results.push(...(await readEntry(entry)))
        continue
      }

      const file = item.getAsFile()
      if (!file) continue

      if (isZipFile(file)) {
        results.push(...(await extractZipFile(file)))
      } else {
        results.push({ file, relativePath: file.name })
      }
    }

    return results
  }

  for (const file of Array.from(dataTransfer.files)) {
    if (isZipFile(file)) {
      results.push(...(await extractZipFile(file)))
    } else {
      const relativePath =
        (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name
      results.push({ file, relativePath })
    }
  }

  return results
}
