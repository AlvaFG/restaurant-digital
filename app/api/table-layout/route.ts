import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import { access } from "node:fs/promises"
import { constants as fsConstants } from "node:fs"
import path from "node:path"

import { MOCK_TABLES, MOCK_TABLE_LAYOUT, type Table, type TableMapLayout } from "@/lib/mock-data"

const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "table-layout.json")

interface PersistedLayout {
  layout: TableMapLayout
  tables: Table[]
  updatedAt: string
}

async function readPersistedLayout(): Promise<PersistedLayout | null> {
  try {
    await access(DATA_FILE, fsConstants.F_OK)
  } catch {
    return null
  }

  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8")
    const parsed = JSON.parse(raw) as PersistedLayout

    if (!parsed.layout || !parsed.tables) {
      return null
    }

    return parsed
  } catch (error) {
    console.error("[table-layout] Failed to read persisted layout", error)
    return null
  }
}

async function persistLayout(payload: PersistedLayout) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8")
}

export async function GET() {
  const persisted = await readPersistedLayout()

  const payload: PersistedLayout =
    persisted ?? {
      layout: structuredClone(MOCK_TABLE_LAYOUT),
      tables: structuredClone(MOCK_TABLES),
      updatedAt: new Date().toISOString(),
    }

  return NextResponse.json(payload)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<PersistedLayout>

    if (!body || !body.layout || !body.tables) {
      return NextResponse.json({ error: "Missing layout or tables" }, { status: 400 })
    }

    const payload: PersistedLayout = {
      layout: body.layout,
      tables: body.tables,
      updatedAt: new Date().toISOString(),
    }

    await persistLayout(payload)

    return NextResponse.json(payload, { status: 201 })
  } catch (error) {
    console.error("[table-layout] Failed to save layout", error)
    return NextResponse.json({ error: "Unexpected error saving layout" }, { status: 500 })
  }
}
