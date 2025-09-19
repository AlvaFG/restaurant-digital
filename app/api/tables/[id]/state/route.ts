import { NextResponse } from "next/server"

import {
  getTableById,
  updateTableState,
} from "@/lib/server/table-store"
import { isTableState } from "@/lib/table-states"

interface UpdateStateRequest {
  status: string
  reason?: string
  actor?: {
    id?: string
    name?: string
    role?: string
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    const table = await getTableById(context.params.id)
    if (!table) {
      return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 })
    }

    const payload = (await request.json()) as UpdateStateRequest

    if (!payload?.status || !isTableState(payload.status)) {
      return NextResponse.json({ error: "Estado invalido" }, { status: 400 })
    }

    const updated = await updateTableState(context.params.id, payload.status, {
      actor: payload.actor,
      reason: payload.reason,
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Table not found") {
        return NextResponse.json({ error: "Mesa no encontrada" }, { status: 404 })
      }

      if (error.message.startsWith("Invalid transition")) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    console.error("[api/tables/:id/state] Failed to update state", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el estado de la mesa" },
      { status: 500 },
    )
  }
}

export async function OPTIONS() {
  return NextResponse.json({ actions: ["PATCH"] })
}
