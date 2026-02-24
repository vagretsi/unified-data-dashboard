// src/lib/collector.ts
// Run with: npx ts-node src/lib/collector.ts
// Or add to package.json scripts: "collect": "ts-node src/lib/collector.ts"

import si from 'systeminformation';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function collectAndStore() {
  try {
    // Gather all metrics in parallel
    const [cpu, mem, disk, time] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.time(),
    ]);

    const now = new Date();

    // Prepare upsert data
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
        metric_value: parseFloat((((mem.total - mem.available) / mem.total) * 100).toFixed(1)),
        status: (mem.used / mem.total) > 0.85 ? 'critical' : (mem.used / mem.total) > 0.7 ? 'warning' : 'up',
      },
      {
        source_name: 'system',
        metric_label: 'Free Memory (GB)',
        metric_value: parseFloat((mem.free / 1024 / 1024 / 1024).toFixed(2)),
        status: mem.free < 512 * 1024 * 1024 ? 'critical' : 'up',
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
        status: 'up', // if we got here, DB is up
      },
    ];

    // Upsert each metric (update if exists, insert if not)
    for (const metric of metrics) {
      await prisma.metric.upsert({
        where: {
          // You need a unique constraint on source_name + metric_label
          // See migration note below
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

    console.log(`[${now.toISOString()}] ✅ Metrics updated`);
    console.log(`  CPU: ${metrics[0].metric_value}% (${metrics[0].status})`);
    console.log(`  Memory: ${metrics[1].metric_value}% (${metrics[1].status})`);
    console.log(`  Disk: ${metrics[3].metric_value}% (${metrics[3].status})`);

  } catch (error) {
    console.error('❌ Collector error:', error);
  }
}

// Run immediately, then every 30 seconds
collectAndStore();
setInterval(collectAndStore, 30_000);

console.log('🚀 Collector started — updating every 30 seconds');