import path from "node:path"

function resolveBaseDir() {
  const override = process.env.RESTAURANT_DATA_DIR?.trim()
  if (!override) {
    return path.join(process.cwd(), "data")
  }

  return path.isAbsolute(override) ? override : path.join(process.cwd(), override)
}

export function getDataDir() {
  return resolveBaseDir()
}

export function getDataFile(filename: string) {
  return path.join(resolveBaseDir(), filename)
}
