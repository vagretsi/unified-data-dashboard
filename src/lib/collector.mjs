import si from 'systeminformation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function collectAndStore() {
  try {
    const [cpu, mem, disk] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    const now = new Date();
    const realMemUsed = (mem.total - mem.available) / mem.total;

    const metrics = [
      {
        source_name: 'system',
        metric_label: 'CPU Usage',
        metric_value: parseFloat(cpu.currentLoad.toFixed(1)),
        status: cpu.currentLoad > 80 ? 'critical' : cpu.currentLoad > 60 ? 'warning' : 'up',
      },
      {
        source_name: 'system',
        metric_label: 'Memory Usage',
        metric_value: parseFloat((realMemUsed * 100).toFixed(1)),
        status: realMemUsed > 0.85 ? 'critical' : realMemUsed > 0.7 ? 'warning' : 'up',
      },
      {
        source_name: 'system',
        metric_label: 'Free Memory (GB)',
        metric_value: parseFloat((mem.available / 1024 / 1024 / 1024).toFixed(2)),
        status: mem.available < 512 * 1024 * 1024 ? 'critical' : 'up',
      },
      {
        source_name: 'disk',
        metric_label: 'Disk Usage',
        metric_value: parseFloat(disk[0]?.use?.toFixed(1) ?? '0'),
        status: (disk[0]?.use ?? 0) > 90 ? 'critical' : (disk[0]?.use ?? 0) > 75 ? 'warning' : 'up',
      },
      {
        source_name: 'disk',
        metric_label: 'Free Disk (GB)',
        metric_value: parseFloat(((disk[0]?.available ?? 0) / 1024 / 1024 / 1024).toFixed(1)),
        status: (disk[0]?.available ?? 0) < 5 * 1024 * 1024 * 1024 ? 'critical' : 'up',
      },
      {
        source_name: 'database',
        metric_label: 'DB Connection',
        metric_value: 1,
        status: 'up',
      },
    ];

    for (const metric of metrics) {
      await prisma.metric.upsert({
        where: {
          source_metric: {
            source_name: metric.source_name,
            metric_label: metric.metric_label,
          },
        },
        update: {
          metric_value: metric.metric_value,
          status: metric.status,
          updated_at: now,
        },
        create: {
          source_name: metric.source_name,
          metric_label: metric.metric_label,
          metric_value: metric.metric_value,
          status: metric.status,
          updated_at: now,
        },
      });
    }

    console.log(`[${now.toISOString()}] ✅ CPU: ${metrics[0].metric_value}% | RAM: ${metrics[1].metric_value}% | Disk: ${metrics[3].metric_value}%`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

collectAndStore();
setInterval(collectAndStore, 30_000);
console.log('🚀 Collector started — updating every 30 seconds');