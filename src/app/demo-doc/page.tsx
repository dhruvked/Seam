import { redirect } from 'next/navigation'
import { getAllDoctors } from '@/lib/doctors-db'

export default async function DemoDocRootPage() {
  const doctors = await getAllDoctors()
  if (doctors && doctors.length > 0) {
    redirect(`/demo-doc/${doctors[0].id}`)
  }
  redirect('/admin')
}
