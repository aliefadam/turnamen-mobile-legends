import { notFound, redirect } from "next/navigation";
import EditPesertaForm from "@/components/admin/EditPesertaForm";
import { getAdminInfo } from "@/lib/admin-session";
import { getRegistrationById } from "@/lib/registrations";

export const dynamic = "force-dynamic";
export default async function EditEventParticipant({ params }: { params: Promise<{ id: string; registrationId: string }> }) {
  const admin = await getAdminInfo(); if (admin?.role !== "superadmin") redirect("/admin/events");
  const { id, registrationId } = await params; const registration = await getRegistrationById(Number(registrationId));
  if (!registration || registration.eventId !== Number(id)) notFound();
  return <EditPesertaForm registration={registration} backPath={`/admin/events/${id}`} />;
}
