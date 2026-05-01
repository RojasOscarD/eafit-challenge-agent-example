import { NextRequest, NextResponse } from 'next/server';
import { BotDB } from '@/lib/db';
import { getAuthUserFromRequest } from '@/lib/auth';
import { deployBot } from '@/lib/k8s';
import { ensureDatabase } from '@/lib/db-init';

// POST /api/bots/[id]/publish - Deploy bot to Kubernetes
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await ensureDatabase();
    const bot = await BotDB.findById(params.id, user.userId);

    if (!bot) {
      return NextResponse.json(
        { message: 'Bot not found' },
        { status: 404 }
      );
    }

    const deploymentResult = await deployBot(bot);

    if (deploymentResult.success) {
      await BotDB.updateStatus(params.id, user.userId, 'published', {
        publicUrl: deploymentResult.publicUrl,
        deploymentName: `bot-${bot.slug}`,
      });

      return NextResponse.json({
        success: true,
        publicUrl: deploymentResult.publicUrl,
      });
    } else {
      await BotDB.updateStatus(params.id, user.userId, 'error');

      return NextResponse.json(
        { message: deploymentResult.error || 'Deployment failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error publishing bot:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
