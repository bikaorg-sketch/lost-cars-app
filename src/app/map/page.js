import dynamic from 'next/dynamic';
import { prisma } from '@/lib/prisma';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export const dynamic_render = 'force-dynamic';

export default async function MapPage() {
  const reports = await prisma.report.findMany({
    where: {
      status: 'approved',
      latitude: { not: null },
      longitude: { not: null },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">خريطة البلاغات</h1>
        <p className="text-slate-600">
          {reports.length} بلاغ على الخريطة. انقر على أي علامة لعرض التفاصيل.
        </p>
      </div>

      <MapView markers={reports} height="600px" />
    </div>
  );
}
