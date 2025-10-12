import { ZonesManagement } from "@/components/zones-management"
import { ProtectedRoute } from "@/components/protected-route"

export default function ZonasConfigPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 space-y-6">
        <ZonesManagement />
      </div>
    </ProtectedRoute>
  )
}
