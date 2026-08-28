import { permanentRedirect } from 'next/navigation'

/** Legacy path from before the dashboard existed. Kept so old links resolve. */
export default async function LegacyMaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  permanentRedirect(`/app/documents/${id}`)
}
